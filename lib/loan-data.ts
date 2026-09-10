import 'server-only';

import { and, asc, desc, eq, inArray, or, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { ensureDatabase, getDb } from '@/db';
import { books, loans, user } from '@/db/schema';
import { findMemberIdByExactName } from '@/lib/member-data';
import { ACTIVE_LOAN_STATUSES, loanStatusSchema, type LoanAction, type LoanStatus } from '@/lib/schemas/loan';
import type { LoanView } from '@/lib/types/loan';

const borrower = alias(user, 'borrower');
const owner = alias(user, 'owner');

const loanSelection = {
	id: loans.id,
	bookId: loans.bookId,
	bookTitle: books.title,
	bookAuthor: books.author,
	coverImageUrl: books.coverImageUrl,
	location: books.location,
	borrowerId: loans.borrowerId,
	borrowerName: borrower.name,
	ownerId: books.ownerId,
	ownerName: owner.name,
	status: loans.status,
	requestedAt: loans.requestedAt,
	updatedAt: loans.updatedAt,
};

type LoanRow = Omit<LoanView, 'status' | 'queuePosition'> & { status: string };

export class LoanError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code: string,
	) {
		super(message);
		this.name = 'LoanError';
	}
}

function toLoanView(row: LoanRow, queuePosition: number | null = null): LoanView {
	return { ...row, status: loanStatusSchema.parse(row.status), queuePosition };
}

function isUniqueConflict(error: unknown) {
	if (!(error instanceof Error)) return false;
	const cause = error.cause as { code?: string } | undefined;
	return cause?.code === '23505' || error.message.includes('unique constraint');
}

async function addQueuePositions(rows: LoanRow[]) {
	const bookIds = [...new Set(rows.filter((row) => row.status === 'REQUESTED').map((row) => row.bookId))];
	if (!bookIds.length) return rows.map((row) => toLoanView(row));
	const queued = await getDb()
		.select({ id: loans.id, bookId: loans.bookId })
		.from(loans)
		.where(and(inArray(loans.bookId, bookIds), eq(loans.status, 'REQUESTED')))
		.orderBy(asc(loans.requestedAt), asc(loans.id));
	const positions = new Map<string, number>();
	const counts = new Map<string, number>();
	for (const item of queued) {
		const position = (counts.get(item.bookId) ?? 0) + 1;
		counts.set(item.bookId, position);
		positions.set(item.id, position);
	}
	return rows.map((row) => toLoanView(row, row.status === 'REQUESTED' ? (positions.get(row.id) ?? null) : null));
}

async function selectLoanRows(condition?: SQL, direction: 'asc' | 'desc' = 'desc') {
	return getDb()
		.select(loanSelection)
		.from(loans)
		.innerJoin(books, eq(loans.bookId, books.id))
		.innerJoin(borrower, eq(loans.borrowerId, borrower.id))
		.innerJoin(owner, eq(books.ownerId, owner.id))
		.where(condition)
		.orderBy(direction === 'asc' ? asc(loans.requestedAt) : desc(loans.requestedAt), asc(loans.id));
}

export async function listLoansForUser(userId: string) {
	await ensureDatabase();
	const [borrowedRows, lentRows] = await Promise.all([selectLoanRows(eq(loans.borrowerId, userId)), selectLoanRows(eq(books.ownerId, userId))]);
	const [borrowed, lent] = await Promise.all([addQueuePositions(borrowedRows), addQueuePositions(lentRows)]);
	return { borrowed, lent };
}

export async function listIncomingLoans(ownerId: string) {
	await ensureDatabase();
	return addQueuePositions(await selectLoanRows(and(eq(books.ownerId, ownerId), eq(loans.status, 'REQUESTED')), 'asc'));
}

export async function getActiveLoanForBook(bookId: string) {
	await ensureDatabase();
	const rows = await selectLoanRows(and(eq(loans.bookId, bookId), inArray(loans.status, ACTIVE_LOAN_STATUSES)));
	return rows[0] ? toLoanView(rows[0]) : null;
}

export async function getBookLoanContext(bookId: string, viewerId?: string) {
	await ensureDatabase();
	const [currentRows, queueRows] = await Promise.all([
		selectLoanRows(and(eq(loans.bookId, bookId), inArray(loans.status, ACTIVE_LOAN_STATUSES))),
		selectLoanRows(and(eq(loans.bookId, bookId), eq(loans.status, 'REQUESTED')), 'asc'),
	]);
	const queue = queueRows.map((row, index) => toLoanView(row, index + 1));
	return {
		currentLoan: currentRows[0] ? toLoanView(currentRows[0]) : null,
		queue,
		viewerReservation: viewerId ? (queue.find((item) => item.borrowerId === viewerId) ?? null) : null,
	};
}

export async function hasLoanHistory(bookId: string) {
	await ensureDatabase();
	return (await getDb().select({ id: loans.id }).from(loans).where(eq(loans.bookId, bookId)).limit(1)).length > 0;
}

export async function requestLoan(bookId: string, borrowerId: string) {
	await ensureDatabase();
	try {
		return await getDb().transaction(async (tx) => {
			const [book] = await tx
				.select({
					id: books.id,
					ownerId: books.ownerId,
					status: books.status,
					currentBorrowerId: books.currentBorrowerId,
				})
				.from(books)
				.where(eq(books.id, bookId))
				.limit(1);
			const [member] = await tx.select({ name: user.name }).from(user).where(eq(user.id, borrowerId)).limit(1);
			if (!book || !member) throw new LoanError('책을 찾을 수 없어요.', 404, 'BOOK_NOT_FOUND');
			if (book.currentBorrowerId === borrowerId) throw new LoanError('이미 이 책을 대여 중이에요.', 409, 'ALREADY_BORROWING');
			if (book.status === 'UNAVAILABLE') throw new LoanError('지금은 빌릴 수 없는 책이에요.', 409, 'BOOK_UNAVAILABLE');
			const now = new Date();
			if (book.status === 'AVAILABLE') {
				const changed = await tx
					.update(books)
					.set({
						status: 'BORROWED',
						currentBorrowerId: borrowerId,
						currentBorrowerName: member.name,
						updatedAt: now,
					})
					.where(and(eq(books.id, bookId), eq(books.status, 'AVAILABLE')))
					.returning({ id: books.id });
				if (!changed.length) throw new LoanError('다른 동료가 먼저 빌렸어요. 예약으로 다시 시도해 주세요.', 409, 'STALE_BOOK');
				const [created] = await tx
					.insert(loans)
					.values({ bookId, borrowerId, status: 'BORROWED', borrowedAt: now })
					.returning({ id: loans.id });
				return { ...created, status: 'BORROWED' as const, queuePosition: null };
			}
			const [created] = await tx.insert(loans).values({ bookId, borrowerId, status: 'REQUESTED' }).returning({ id: loans.id });
			const queued = await tx
				.select({ id: loans.id })
				.from(loans)
				.where(and(eq(loans.bookId, bookId), eq(loans.status, 'REQUESTED')))
				.orderBy(asc(loans.requestedAt), asc(loans.id));
			return {
				...created,
				status: 'REQUESTED' as const,
				queuePosition: queued.findIndex((item) => item.id === created.id) + 1,
			};
		});
	} catch (error) {
		if (error instanceof LoanError) throw error;
		if (isUniqueConflict(error)) throw new LoanError('이미 이 책을 예약했어요.', 409, 'RESERVATION_EXISTS');
		throw error;
	}
}

type TransitionRecord = {
	id: string;
	status: LoanStatus;
	borrowerId: string;
	ownerId: string;
	bookId: string;
};
function requireOwner(record: TransitionRecord, userId: string) {
	if (record.ownerId !== userId) throw new LoanError('책 등록자만 처리할 수 있어요.', 403, 'OWNER_ONLY');
}
function requireBorrower(record: TransitionRecord, userId: string) {
	if (record.borrowerId !== userId) throw new LoanError('본인의 대여·예약만 처리할 수 있어요.', 403, 'BORROWER_ONLY');
}
function requireStatus(record: TransitionRecord, allowed: LoanStatus[]) {
	if (!allowed.includes(record.status)) throw new LoanError('이미 처리되었거나 지금은 할 수 없어요.', 409, 'INVALID_TRANSITION');
}

export async function transitionLoan(loanId: string, action: LoanAction, userId: string) {
	await ensureDatabase();
	return getDb().transaction(async (tx) => {
		const [raw] = await tx
			.select({
				id: loans.id,
				status: loans.status,
				borrowerId: loans.borrowerId,
				ownerId: books.ownerId,
				bookId: loans.bookId,
			})
			.from(loans)
			.innerJoin(books, eq(loans.bookId, books.id))
			.where(eq(loans.id, loanId))
			.limit(1);
		if (!raw) throw new LoanError('대여·예약을 찾을 수 없어요.', 404, 'LOAN_NOT_FOUND');
		const record: TransitionRecord = {
			...raw,
			status: loanStatusSchema.parse(raw.status),
		};
		const now = new Date();

		if (action === 'CANCEL') {
			requireBorrower(record, userId);
			requireStatus(record, ['REQUESTED']);
			await tx
				.update(loans)
				.set({ status: 'CANCELLED', resolvedAt: now, updatedAt: now })
				.where(and(eq(loans.id, loanId), eq(loans.status, 'REQUESTED')));
			return { id: loanId, status: 'CANCELLED' as const };
		}
		if (action === 'REQUEST_RETURN') {
			requireBorrower(record, userId);
			requireStatus(record, ['BORROWED']);
			await tx
				.update(loans)
				.set({
					status: 'RETURN_REQUESTED',
					returnRequestedAt: now,
					updatedAt: now,
				})
				.where(and(eq(loans.id, loanId), eq(loans.status, 'BORROWED')));
			return { id: loanId, status: 'RETURN_REQUESTED' as const };
		}

		requireOwner(record, userId);
		requireStatus(record, ['RETURN_REQUESTED']);
		const [next] = await tx
			.select({
				id: loans.id,
				borrowerId: loans.borrowerId,
				borrowerName: user.name,
			})
			.from(loans)
			.innerJoin(user, eq(loans.borrowerId, user.id))
			.where(and(eq(loans.bookId, record.bookId), eq(loans.status, 'REQUESTED')))
			.orderBy(asc(loans.requestedAt), asc(loans.id))
			.limit(1);
		await tx
			.update(loans)
			.set({
				status: 'RETURNED',
				returnedAt: now,
				resolvedAt: now,
				updatedAt: now,
			})
			.where(and(eq(loans.id, loanId), eq(loans.status, 'RETURN_REQUESTED')));
		if (next) {
			await tx
				.update(loans)
				.set({ status: 'BORROWED', borrowedAt: now, updatedAt: now })
				.where(and(eq(loans.id, next.id), eq(loans.status, 'REQUESTED')));
			await tx
				.update(books)
				.set({
					status: 'BORROWED',
					currentBorrowerId: next.borrowerId,
					currentBorrowerName: next.borrowerName,
					updatedAt: now,
				})
				.where(eq(books.id, record.bookId));
		} else {
			await tx
				.update(books)
				.set({
					status: 'AVAILABLE',
					currentBorrowerId: null,
					currentBorrowerName: null,
					updatedAt: now,
				})
				.where(eq(books.id, record.bookId));
		}
		return {
			id: loanId,
			status: 'RETURNED' as const,
			nextBorrowerName: next?.borrowerName ?? null,
		};
	});
}

export async function changeBookBorrower(
	bookId: string,
	userId: string,
	input: { borrowerId: string; borrowerName: string; makeAvailable: boolean },
) {
	await ensureDatabase();
	try {
		return await getDb().transaction(async (tx) => {
			const [book] = await tx
				.select({
					ownerId: books.ownerId,
					currentBorrowerId: books.currentBorrowerId,
				})
				.from(books)
				.where(eq(books.id, bookId))
				.limit(1);
			if (!book) throw new LoanError('책을 찾을 수 없어요.', 404, 'BOOK_NOT_FOUND');
			// ponytail: 대여자가 비회원(이름만 입력)이면 계정이 없어 아무도 못 넘기므로 등록자가 대신 처리한다
			const allowed = book.currentBorrowerId ? book.currentBorrowerId === userId : book.ownerId === userId;
			if (!allowed) throw new LoanError('현재 대여자만 대여자를 바꿀 수 있어요.', 403, 'BORROWER_ONLY');
			if (!input.borrowerId && input.borrowerName) input = { ...input, borrowerId: await findMemberIdByExactName(input.borrowerName) };
			const [first] = await tx
				.select({
					id: loans.id,
					borrowerId: loans.borrowerId,
					borrowerName: user.name,
				})
				.from(loans)
				.innerJoin(user, eq(loans.borrowerId, user.id))
				.where(and(eq(loans.bookId, bookId), eq(loans.status, 'REQUESTED')))
				.orderBy(asc(loans.requestedAt), asc(loans.id))
				.limit(1);
			if (first && input.makeAvailable)
				throw new LoanError('예약자가 있어 대여 가능으로 바꿀 수 없어요. 첫 예약자에게 넘겨주세요.', 409, 'QUEUE_NOT_EMPTY');
			if (first && input.borrowerId !== first.borrowerId)
				throw new LoanError(`${first.borrowerName}님이 첫 번째 예약자예요. 순서대로 대여해 주세요.`, 409, 'FIFO_REQUIRED');
			if (!input.makeAvailable && input.borrowerId && input.borrowerId === book.currentBorrowerId)
				throw new LoanError('이미 현재 대여 중인 동료예요.', 409, 'SAME_BORROWER');
			if (input.borrowerId) {
				const [member] = await tx.select({ name: user.name }).from(user).where(eq(user.id, input.borrowerId)).limit(1);
				if (!member) throw new LoanError('선택한 동료를 찾을 수 없어요.', 400, 'MEMBER_NOT_FOUND');
				input = { ...input, borrowerName: member.name };
			}
			const now = new Date();
			await tx
				.update(loans)
				.set({
					status: 'RETURNED',
					returnedAt: now,
					resolvedAt: now,
					updatedAt: now,
				})
				.where(and(eq(loans.bookId, bookId), inArray(loans.status, ACTIVE_LOAN_STATUSES)));
			if (input.makeAvailable) {
				await tx
					.update(books)
					.set({
						status: 'AVAILABLE',
						currentBorrowerId: null,
						currentBorrowerName: null,
						updatedAt: now,
					})
					.where(eq(books.id, bookId));
				return {
					bookId,
					status: 'AVAILABLE' as const,
					currentBorrowerName: null,
				};
			}
			if (first) {
				await tx
					.update(loans)
					.set({ status: 'BORROWED', borrowedAt: now, updatedAt: now })
					.where(and(eq(loans.id, first.id), eq(loans.status, 'REQUESTED')));
			} else if (input.borrowerId) {
				await tx.insert(loans).values({
					bookId,
					borrowerId: input.borrowerId,
					status: 'BORROWED',
					borrowedAt: now,
				});
			}
			await tx
				.update(books)
				.set({
					status: 'BORROWED',
					currentBorrowerId: input.borrowerId || null,
					currentBorrowerName: input.borrowerName,
					updatedAt: now,
				})
				.where(eq(books.id, bookId));
			return {
				bookId,
				status: 'BORROWED' as const,
				currentBorrowerName: input.borrowerName,
			};
		});
	} catch (error) {
		if (error instanceof LoanError) throw error;
		if (isUniqueConflict(error)) throw new LoanError('대여자 변경이 겹쳤어요. 새로고침 후 다시 시도해 주세요.', 409, 'STALE_CHANGE');
		throw error;
	}
}

export async function hasActiveLoan(bookId: string) {
	await ensureDatabase();
	return (
		(
			await getDb()
				.select({ id: loans.id })
				.from(loans)
				.where(and(eq(loans.bookId, bookId), inArray(loans.status, ACTIVE_LOAN_STATUSES)))
				.limit(1)
		).length > 0
	);
}

export async function countPendingLoanRequests(userId: string) {
	await ensureDatabase();
	return (
		await getDb()
			.select({ id: loans.id })
			.from(loans)
			.innerJoin(books, eq(loans.bookId, books.id))
			.where(and(eq(books.ownerId, userId), eq(loans.status, 'REQUESTED')))
	).length;
}

export async function getRelevantLoanForUser(bookId: string, userId: string) {
	await ensureDatabase();
	const rows = await selectLoanRows(
		and(
			eq(loans.bookId, bookId),
			or(eq(loans.borrowerId, userId), eq(books.ownerId, userId)),
			or(inArray(loans.status, ACTIVE_LOAN_STATUSES), eq(loans.status, 'REQUESTED')),
		),
	);
	const views = await addQueuePositions(rows);
	return views[0] ?? null;
}
