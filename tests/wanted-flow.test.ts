// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const requesterId = `wanted-requester-${randomUUID()}`;
const ownerId = `wanted-owner-${randomUUID()}`;
const otherId = `wanted-other-${randomUUID()}`;
const testUserIds = [requesterId, ownerId, otherId];

let db: ReturnType<(typeof import('@/db'))['getDb']>;
let schema: typeof import('@/db/schema');
let wantedData: typeof import('@/lib/wanted-data');

/** 테스트 DB의 다른 데이터와 겹치지 않는 ISBN13 */
function randomIsbn() {
	return `979${String(Math.floor(Math.random() * 1e10)).padStart(10, '0')}`;
}

function wantedInput(overrides: Partial<Record<'title' | 'isbn' | 'message', string>> = {}) {
	return { title: '찾는 책', author: '테스트 저자', publisher: '', isbn: randomIsbn(), coverImageUrl: '', publishedAt: '', sourceLink: '', message: '', ...overrides };
}

beforeAll(async () => {
	const databaseModule = await import('@/db');
	schema = await import('@/db/schema');
	wantedData = await import('@/lib/wanted-data');
	await databaseModule.ensureDatabase();
	db = databaseModule.getDb();
	await db.insert(schema.user).values([
		{ id: requesterId, name: '찾는 사람', email: `${requesterId}@example.com` },
		{ id: ownerId, name: '가진 사람', email: `${ownerId}@example.com` },
		{ id: otherId, name: '다른 사람', email: `${otherId}@example.com` },
	]);
});

afterAll(async () => {
	if (!db) return;
	// 요청과 응답, 책은 user cascade로 함께 지워진다.
	await db.delete(schema.user).where(inArray(schema.user.id, testUserIds));
});

describe('책 찾아요 등록', () => {
	it('등록하면 찾는 중 목록에 응답 0명으로 보인다', async () => {
		const created = await wantedData.createWantedBook(wantedInput({ message: '꼭 읽고 싶어요' }), requesterId);
		expect(await wantedData.getWantedBook(created.id)).toMatchObject({
			requesterName: '찾는 사람',
			status: 'OPEN',
			message: '꼭 읽고 싶어요',
			publisher: null,
			offerCount: 0,
		});
		const { wantedBooks } = await wantedData.listWantedBooks({ status: 'OPEN', limit: 100 });
		expect(wantedBooks.map((item) => item.id)).toContain(created.id);
	});

	it('같은 책을 찾는 중이면 다시 올릴 수 없고, 해결 후에는 올릴 수 있다', async () => {
		const input = wantedInput();
		const first = await wantedData.createWantedBook(input, requesterId);
		await expect(wantedData.createWantedBook(input, requesterId)).rejects.toMatchObject({ status: 409 });
		// 다른 사람은 같은 책을 찾을 수 있다.
		await wantedData.createWantedBook(input, otherId);
		await wantedData.updateWantedStatus(first.id, 'FOUND', requesterId);
		await expect(wantedData.createWantedBook(input, requesterId)).resolves.toHaveProperty('id');
	});
});

describe('나 그거 있어요', () => {
	it('다른 사람은 누를 때마다 켜고 끌 수 있고 수가 집계된다', async () => {
		const wanted = await wantedData.createWantedBook(wantedInput(), requesterId);
		expect(await wantedData.toggleWantedOffer(wanted.id, ownerId)).toEqual({ offered: true });
		expect(await wantedData.toggleWantedOffer(wanted.id, otherId)).toEqual({ offered: true });
		expect(await wantedData.getWantedBook(wanted.id)).toMatchObject({ offerCount: 2 });
		expect((await wantedData.listWantedOffers(wanted.id)).map((offer) => offer.userName)).toEqual(['가진 사람', '다른 사람']);

		expect(await wantedData.toggleWantedOffer(wanted.id, otherId)).toEqual({ offered: false });
		expect(await wantedData.getWantedBook(wanted.id)).toMatchObject({ offerCount: 1 });
	});

	it('요청한 본인은 누를 수 없다', async () => {
		const wanted = await wantedData.createWantedBook(wantedInput(), requesterId);
		await expect(wantedData.toggleWantedOffer(wanted.id, requesterId)).rejects.toMatchObject({ status: 403 });
	});

	it('해결된 요청에는 새로 누를 수 없지만 이미 남긴 건 취소할 수 있다', async () => {
		const wanted = await wantedData.createWantedBook(wantedInput(), requesterId);
		await wantedData.toggleWantedOffer(wanted.id, ownerId);
		await wantedData.updateWantedStatus(wanted.id, 'FOUND', requesterId);
		await expect(wantedData.toggleWantedOffer(wanted.id, otherId)).rejects.toMatchObject({ status: 409 });
		expect(await wantedData.toggleWantedOffer(wanted.id, ownerId)).toEqual({ offered: false });
	});
});

describe('해결과 삭제', () => {
	it('요청자만 상태를 바꾸고, 삭제는 요청자나 관리자만 한다', async () => {
		const wanted = await wantedData.createWantedBook(wantedInput(), requesterId);
		await expect(wantedData.updateWantedStatus(wanted.id, 'FOUND', otherId)).rejects.toMatchObject({ status: 403 });
		await wantedData.updateWantedStatus(wanted.id, 'FOUND', requesterId);
		expect(await wantedData.getWantedBook(wanted.id)).toMatchObject({ status: 'FOUND' });

		await expect(wantedData.deleteWantedBook(wanted.id, { id: otherId, isAdmin: false })).rejects.toMatchObject({ status: 403 });
		await wantedData.deleteWantedBook(wanted.id, { id: otherId, isAdmin: true });
		expect(await wantedData.getWantedBook(wanted.id)).toBeNull();
	});

	it('요청을 지우면 응답도 함께 지워진다', async () => {
		const wanted = await wantedData.createWantedBook(wantedInput(), requesterId);
		await wantedData.toggleWantedOffer(wanted.id, ownerId);
		await wantedData.deleteWantedBook(wanted.id, { id: requesterId, isAdmin: false });
		expect(await db.select().from(schema.wantedBookOffers).where(eq(schema.wantedBookOffers.wantedBookId, wanted.id))).toHaveLength(0);
	});
});

describe('서가 매칭', () => {
	it('카카오 ISBN 중 하나라도 같은 책이 서가에 있으면 찾아준다', async () => {
		const isbn13 = randomIsbn();
		const [book] = await db.insert(schema.books).values({ title: '서가의 책', author: '저자', isbn: `8900000000 ${isbn13}`, ownerId }).returning({ id: schema.books.id });
		expect(await wantedData.findLibraryMatches(`1100000000 ${isbn13}`)).toEqual([{ id: book.id, title: '서가의 책', status: 'AVAILABLE' }]);
		expect(await wantedData.findLibraryMatches(randomIsbn())).toEqual([]);
		expect(await wantedData.findLibraryMatches(null)).toEqual([]);
	});

	it('ISBN 형식이 아닌 조각은 무시한다', () => {
		expect(wantedData.isbnTokens('8966262473 9788966262472')).toEqual(['8966262473', '9788966262472']);
		expect(wantedData.isbnTokens(' %  abc ')).toEqual([]);
	});
});
