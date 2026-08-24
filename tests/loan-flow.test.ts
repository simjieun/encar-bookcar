// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const ownerId = `owner-${randomUUID()}`;
const borrowerAId = `borrower-a-${randomUUID()}`;
const borrowerBId = `borrower-b-${randomUUID()}`;
const borrowerCId = `borrower-c-${randomUUID()}`;
const outsiderId = `outsider-${randomUUID()}`;
const testUserIds = [ownerId, borrowerAId, borrowerBId, borrowerCId, outsiderId];

let db: ReturnType<(typeof import('@/db'))['getDb']>;
let schema: typeof import('@/db/schema');
let loanData: typeof import('@/lib/loan-data');

async function createBook(title: string, borrowed = false) {
	const [created] = await db
		.insert(schema.books)
		.values({
			title,
			author: '테스트 저자',
			ownerId,
			status: borrowed ? 'BORROWED' : 'AVAILABLE',
			currentBorrowerId: borrowed ? borrowerAId : null,
			currentBorrowerName: borrowed ? '대여자 A' : null,
		})
		.returning({ id: schema.books.id });
	let currentLoanId: string | null = null;
	if (borrowed) {
		const [loan] = await db
			.insert(schema.loans)
			.values({
				bookId: created.id,
				borrowerId: borrowerAId,
				status: 'BORROWED',
				borrowedAt: new Date(),
			})
			.returning({ id: schema.loans.id });
		currentLoanId = loan.id;
	}
	return { bookId: created.id, currentLoanId };
}

beforeAll(async () => {
	const databaseModule = await import('@/db');
	schema = await import('@/db/schema');
	loanData = await import('@/lib/loan-data');
	await databaseModule.ensureDatabase();
	db = databaseModule.getDb();
	await db.insert(schema.user).values([
		{ id: ownerId, name: '책 등록자', email: `${ownerId}@example.com` },
		{ id: borrowerAId, name: '대여자 A', email: `${borrowerAId}@example.com` },
		{ id: borrowerBId, name: '대여자 B', email: `${borrowerBId}@example.com` },
		{ id: borrowerCId, name: '대여자 C', email: `${borrowerCId}@example.com` },
		{ id: outsiderId, name: '다른 사용자', email: `${outsiderId}@example.com` },
	]);
});

afterAll(async () => {
	if (!db || !schema) return;
	const testBooks = await db.select({ id: schema.books.id }).from(schema.books).where(eq(schema.books.ownerId, ownerId));
	const bookIds = testBooks.map((book) => book.id);
	if (bookIds.length) {
		await db.delete(schema.loans).where(inArray(schema.loans.bookId, bookIds));
		await db.delete(schema.books).where(inArray(schema.books.id, bookIds));
	}
	await db.delete(schema.user).where(inArray(schema.user.id, testUserIds));
});

describe('현재 대여자와 선입선출 예약', () => {
	it('등록자도 대여자가 아니면 예약 순서에 참여할 수 있다', async () => {
		const { bookId } = await createBook('등록자 예약', true);
		const loan = await loanData.requestLoan(bookId, ownerId);
		expect(loan).toMatchObject({ status: 'REQUESTED', queuePosition: 1 });
	});

	it('대여 가능한 책은 요청 즉시 현재 대여자가 된다', async () => {
		const { bookId } = await createBook('즉시 대여');
		const loan = await loanData.requestLoan(bookId, borrowerBId);
		expect(loan).toMatchObject({ status: 'BORROWED', queuePosition: null });
		const [book] = await db.select().from(schema.books).where(eq(schema.books.id, bookId));
		expect(book).toMatchObject({
			status: 'BORROWED',
			currentBorrowerId: borrowerBId,
			currentBorrowerName: '대여자 B',
		});
	});

	it('대여 중에는 여러 동료를 신청 시간 순으로 예약한다', async () => {
		const { bookId } = await createBook('예약 순서', true);
		const first = await loanData.requestLoan(bookId, borrowerBId);
		const second = await loanData.requestLoan(bookId, borrowerCId);
		expect(first.queuePosition).toBe(1);
		expect(second.queuePosition).toBe(2);
		const context = await loanData.getBookLoanContext(bookId, borrowerCId);
		expect(context.queue.map((item) => item.borrowerId)).toEqual([borrowerBId, borrowerCId]);
		expect(context.viewerReservation?.queuePosition).toBe(2);
	});

	it('같은 동료의 중복 예약을 막는다', async () => {
		const { bookId } = await createBook('중복 예약', true);
		await loanData.requestLoan(bookId, borrowerBId);
		await expect(loanData.requestLoan(bookId, borrowerBId)).rejects.toMatchObject({ code: 'RESERVATION_EXISTS' });
	});

	it('반납 완료 시 첫 예약자를 자동으로 대여자로 올린다', async () => {
		const { bookId, currentLoanId } = await createBook('자동 다음 대여', true);
		await loanData.requestLoan(bookId, borrowerBId);
		await loanData.requestLoan(bookId, borrowerCId);
		await loanData.transitionLoan(currentLoanId!, 'REQUEST_RETURN', borrowerAId);
		const result = await loanData.transitionLoan(currentLoanId!, 'COMPLETE_RETURN', ownerId);
		expect(result.nextBorrowerName).toBe('대여자 B');
		const [book] = await db.select().from(schema.books).where(eq(schema.books.id, bookId));
		expect(book.currentBorrowerId).toBe(borrowerBId);
		const context = await loanData.getBookLoanContext(bookId, borrowerCId);
		expect(context.currentLoan?.borrowerId).toBe(borrowerBId);
		expect(context.viewerReservation?.queuePosition).toBe(1);
	});

	it('현재 대여자가 예약 순서를 건너뛰어 대여자를 변경하지 못하게 한다', async () => {
		const { bookId } = await createBook('순서 강제', true);
		await loanData.requestLoan(bookId, borrowerBId);
		await loanData.requestLoan(bookId, borrowerCId);
		await expect(
			loanData.changeBookBorrower(bookId, borrowerAId, {
				borrowerId: borrowerCId,
				borrowerName: '대여자 C',
				makeAvailable: false,
			}),
		).rejects.toMatchObject({ code: 'FIFO_REQUIRED' });
		await expect(
			loanData.changeBookBorrower(bookId, borrowerAId, {
				borrowerId: borrowerBId,
				borrowerName: '대여자 B',
				makeAvailable: false,
			}),
		).resolves.toMatchObject({ currentBorrowerName: '대여자 B' });
	});

	it('대여자가 아닌 등록자는 대여자를 바꿀 수 없다', async () => {
		const { bookId } = await createBook('대여자만 변경', true);
		await expect(
			loanData.changeBookBorrower(bookId, ownerId, {
				borrowerId: borrowerBId,
				borrowerName: '대여자 B',
				makeAvailable: false,
			}),
		).rejects.toMatchObject({ code: 'BORROWER_ONLY' });
	});

	it('예약 취소 후 뒤 예약자의 순번을 당긴다', async () => {
		const { bookId } = await createBook('예약 취소', true);
		const first = await loanData.requestLoan(bookId, borrowerBId);
		await loanData.requestLoan(bookId, borrowerCId);
		await expect(loanData.transitionLoan(first.id, 'CANCEL', outsiderId)).rejects.toMatchObject({ code: 'BORROWER_ONLY' });
		await loanData.transitionLoan(first.id, 'CANCEL', borrowerBId);
		const context = await loanData.getBookLoanContext(bookId, borrowerCId);
		expect(context.viewerReservation?.queuePosition).toBe(1);
	});

	it('예약이 없으면 이름 직접 입력으로 대여자를 다시 바꿀 수 있다', async () => {
		const { bookId } = await createBook('직접 대여자 변경', true);
		await loanData.changeBookBorrower(bookId, borrowerAId, {
			borrowerId: '',
			borrowerName: '외부 동료',
			makeAvailable: false,
		});
		const [book] = await db.select().from(schema.books).where(eq(schema.books.id, bookId));
		expect(book).toMatchObject({
			status: 'BORROWED',
			currentBorrowerId: null,
			currentBorrowerName: '외부 동료',
		});
		await loanData.changeBookBorrower(bookId, ownerId, {
			borrowerId: '',
			borrowerName: '',
			makeAvailable: true,
		});
		const [available] = await db.select().from(schema.books).where(eq(schema.books.id, bookId));
		expect(available).toMatchObject({
			status: 'AVAILABLE',
			currentBorrowerName: null,
		});
	});
});
