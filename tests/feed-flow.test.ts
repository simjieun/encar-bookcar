// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const ownerId = `feed-owner-${randomUUID()}`;
const readerId = `feed-reader-${randomUUID()}`;
const outsiderId = `feed-outsider-${randomUUID()}`;
const testUserIds = [ownerId, readerId, outsiderId];

let db: ReturnType<(typeof import('@/db'))['getDb']>;
let schema: typeof import('@/db/schema');
let feedData: typeof import('@/lib/feed-data');

/** status가 주어지면 readerId의 대여 이력을 함께 만든다. */
async function createBook(title: string, status?: 'BORROWED' | 'RETURNED' | 'REQUESTED') {
	const [book] = await db.insert(schema.books).values({ title, author: '테스트 저자', ownerId }).returning({ id: schema.books.id });
	if (status) {
		await db.insert(schema.loans).values({ bookId: book.id, borrowerId: readerId, status });
	}
	return book.id;
}

beforeAll(async () => {
	const databaseModule = await import('@/db');
	schema = await import('@/db/schema');
	feedData = await import('@/lib/feed-data');
	await databaseModule.ensureDatabase();
	db = databaseModule.getDb();
	await db.insert(schema.user).values([
		{ id: ownerId, name: '책 등록자', email: `${ownerId}@example.com` },
		{ id: readerId, name: '읽은 사람', email: `${readerId}@example.com` },
		{ id: outsiderId, name: '안 빌린 사람', email: `${outsiderId}@example.com` },
	]);
});

afterAll(async () => {
	if (!db) return;
	const ourBooks = await db.select({ id: schema.books.id }).from(schema.books).where(eq(schema.books.ownerId, ownerId));
	const bookIds = ourBooks.map((book) => book.id);
	if (bookIds.length) {
		await db.delete(schema.feeds).where(inArray(schema.feeds.bookId, bookIds));
		await db.delete(schema.loans).where(inArray(schema.loans.bookId, bookIds));
		await db.delete(schema.books).where(inArray(schema.books.id, bookIds));
	}
	await db.delete(schema.user).where(inArray(schema.user.id, testUserIds));
});

describe('피드 작성 권한', () => {
	it('빌린 적 없는 책에는 피드를 쓸 수 없다', async () => {
		const bookId = await createBook('안 빌린 책');
		await expect(feedData.createFeed({ bookId, title: '제목', content: '내용' }, outsiderId)).rejects.toMatchObject({ status: 403 });
	});

	it('예약만 한 책은 아직 읽지 않은 것으로 본다', async () => {
		const bookId = await createBook('예약만 한 책', 'REQUESTED');
		const options = await feedData.listReadBooks(readerId);
		expect(options.map((book) => book.id)).not.toContain(bookId);
		await expect(feedData.createFeed({ bookId, title: '제목', content: '내용' }, readerId)).rejects.toMatchObject({ status: 403 });
	});

	it('반납한 책도 피드를 쓸 수 있고 목록에 노출된다', async () => {
		const bookId = await createBook('반납한 책', 'RETURNED');
		expect((await feedData.listReadBooks(readerId)).map((book) => book.id)).toContain(bookId);
		const created = await feedData.createFeed({ bookId, title: '반납 후 기록', content: '## 좋았다' }, readerId);
		const { feeds } = await feedData.listFeeds();
		expect(feeds.map((feed) => feed.id)).toContain(created.id);
		expect(await feedData.getFeed(created.id)).toMatchObject({
			title: '반납 후 기록',
			bookTitle: '반납한 책',
			authorName: '읽은 사람',
			commentCount: 0,
		});
	});
});

describe('피드 수정과 삭제', () => {
	it('작성자만 수정하고 삭제할 수 있다', async () => {
		const bookId = await createBook('대여 중인 책', 'BORROWED');
		const created = await feedData.createFeed({ bookId, title: '처음 제목', content: '처음 내용' }, readerId);
		const input = { bookId, title: '고친 제목', content: '고친 내용' };
		await expect(feedData.updateFeed(created.id, input, outsiderId)).rejects.toMatchObject({ status: 403 });
		await feedData.updateFeed(created.id, input, readerId);
		expect(await feedData.getFeed(created.id)).toMatchObject({ title: '고친 제목' });
		await expect(feedData.deleteFeed(created.id, outsiderId)).rejects.toMatchObject({ status: 403 });
		await feedData.deleteFeed(created.id, readerId);
		expect(await feedData.getFeed(created.id)).toBeNull();
	});
});

describe('피드 댓글', () => {
	it('누구나 댓글을 남기고 본인 댓글만 지울 수 있다', async () => {
		const bookId = await createBook('댓글 달릴 책', 'BORROWED');
		const feed = await feedData.createFeed({ bookId, title: '댓글 테스트', content: '내용' }, readerId);
		const comment = await feedData.createFeedComment(feed.id, { content: '저도 읽고 싶어요' }, outsiderId);
		expect(await feedData.listFeedComments(feed.id)).toMatchObject([
			{ authorName: '안 빌린 사람', content: '저도 읽고 싶어요', parentId: null, replies: [] },
		]);
		expect(await feedData.getFeed(feed.id)).toMatchObject({ commentCount: 1 });
		await expect(feedData.deleteFeedComment(comment.id, readerId)).rejects.toMatchObject({ status: 403 });
		await feedData.deleteFeedComment(comment.id, outsiderId);
		expect(await feedData.listFeedComments(feed.id)).toHaveLength(0);
	});

	it('대댓글은 최상위 댓글 아래에 묶인다', async () => {
		const bookId = await createBook('대댓글 달릴 책', 'BORROWED');
		const feed = await feedData.createFeed({ bookId, title: '대댓글 테스트', content: '내용' }, readerId);
		const parent = await feedData.createFeedComment(feed.id, { content: '부모 댓글' }, outsiderId);
		const reply = await feedData.createFeedComment(feed.id, { content: '답글', parentId: parent.id }, readerId);
		const threads = await feedData.listFeedComments(feed.id);
		expect(threads).toHaveLength(1);
		expect(threads[0]).toMatchObject({ id: parent.id, content: '부모 댓글' });
		expect(threads[0].replies).toMatchObject([{ id: reply.id, content: '답글', parentId: parent.id }]);
		// 피드의 댓글 수는 대댓글까지 센다.
		expect(await feedData.getFeed(feed.id)).toMatchObject({ commentCount: 2 });
	});

	it('대댓글에 답글을 달면 최상위 댓글에 붙는다', async () => {
		const bookId = await createBook('중첩 제한 확인용 책', 'BORROWED');
		const feed = await feedData.createFeed({ bookId, title: '중첩 제한', content: '내용' }, readerId);
		const parent = await feedData.createFeedComment(feed.id, { content: '부모' }, outsiderId);
		const reply = await feedData.createFeedComment(feed.id, { content: '답글', parentId: parent.id }, readerId);
		const nested = await feedData.createFeedComment(feed.id, { content: '답글의 답글', parentId: reply.id }, outsiderId);
		const threads = await feedData.listFeedComments(feed.id);
		expect(threads).toHaveLength(1);
		expect(threads[0].replies.map((item) => item.id)).toEqual([reply.id, nested.id]);
		expect(threads[0].replies.every((item) => item.parentId === parent.id)).toBe(true);
	});

	it('다른 피드의 댓글에는 답글을 달 수 없다', async () => {
		const [bookA, bookB] = await Promise.all([createBook('피드 A의 책', 'BORROWED'), createBook('피드 B의 책', 'BORROWED')]);
		const feedA = await feedData.createFeed({ bookId: bookA, title: 'A', content: '내용' }, readerId);
		const feedB = await feedData.createFeed({ bookId: bookB, title: 'B', content: '내용' }, readerId);
		const commentOnA = await feedData.createFeedComment(feedA.id, { content: 'A의 댓글' }, outsiderId);
		await expect(feedData.createFeedComment(feedB.id, { content: '남의 스레드', parentId: commentOnA.id }, readerId)).rejects.toMatchObject({
			status: 404,
		});
	});

	it('최상위 댓글을 지우면 대댓글도 함께 사라진다', async () => {
		const bookId = await createBook('대댓글 연쇄 삭제용 책', 'BORROWED');
		const feed = await feedData.createFeed({ bookId, title: '연쇄 삭제', content: '내용' }, readerId);
		const parent = await feedData.createFeedComment(feed.id, { content: '부모' }, outsiderId);
		await feedData.createFeedComment(feed.id, { content: '답글', parentId: parent.id }, readerId);
		await feedData.deleteFeedComment(parent.id, outsiderId);
		expect(await feedData.listFeedComments(feed.id)).toHaveLength(0);
	});

	it('피드를 지우면 댓글도 함께 사라진다', async () => {
		const bookId = await createBook('삭제될 피드의 책', 'BORROWED');
		const feed = await feedData.createFeed({ bookId, title: '삭제 테스트', content: '내용' }, readerId);
		await feedData.createFeedComment(feed.id, { content: '댓글' }, outsiderId);
		await feedData.deleteFeed(feed.id, readerId);
		expect(await feedData.listFeedComments(feed.id)).toHaveLength(0);
	});
});
