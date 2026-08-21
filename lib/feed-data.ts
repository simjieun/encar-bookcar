import 'server-only';

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { ensureDatabase, getDb } from '@/db';
import { books, feedComments, feeds, loans, user } from '@/db/schema';
import type { FeedInput } from '@/lib/schemas/feed';
import type { FeedBookOption, FeedCommentThread, FeedCommentView, FeedView } from '@/lib/types/feed';

export const FEED_PAGE_SIZE = 10;

/** 피드를 쓸 수 있는 대여 이력 상태. 예약(REQUESTED)만 한 책은 아직 읽지 않았으므로 제외한다. */
const READ_LOAN_STATUSES = ['BORROWED', 'RETURN_REQUESTED', 'RETURNED'];

export class FeedError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = 'FeedError';
	}
}

const feedSelection = {
	id: feeds.id,
	bookId: feeds.bookId,
	bookTitle: books.title,
	bookAuthor: books.author,
	coverImageUrl: books.coverImageUrl,
	authorId: feeds.authorId,
	authorName: user.name,
	title: feeds.title,
	content: feeds.content,
	commentCount: sql<number>`(select count(*)::int from ${feedComments} where ${feedComments.feedId} = ${feeds.id})`,
	createdAt: feeds.createdAt,
	updatedAt: feeds.updatedAt,
};

function selectFeeds() {
	return getDb().select(feedSelection).from(feeds).innerJoin(books, eq(feeds.bookId, books.id)).innerJoin(user, eq(feeds.authorId, user.id));
}

export async function listFeeds({ page = 1, limit = FEED_PAGE_SIZE, authorId }: { page?: number; limit?: number; authorId?: string } = {}) {
	await ensureDatabase();
	const rows = await selectFeeds()
		.where(authorId ? eq(feeds.authorId, authorId) : undefined)
		.orderBy(desc(feeds.createdAt), desc(feeds.id))
		.limit(limit + 1)
		.offset((page - 1) * limit);

	return { feeds: rows.slice(0, limit) as FeedView[], hasMore: rows.length > limit, page };
}

export async function getFeed(feedId: string) {
	await ensureDatabase();
	const rows = await selectFeeds().where(eq(feeds.id, feedId)).limit(1);
	return (rows.at(0) as FeedView | undefined) ?? null;
}

/** 최상위 댓글 아래에 대댓글을 묶어 돌려준다. 중첩이 1단계뿐이라 한 번 조회하고 메모리에서 묶는다. */
export async function listFeedComments(feedId: string): Promise<FeedCommentThread[]> {
	await ensureDatabase();
	const rows = (await getDb()
		.select({
			id: feedComments.id,
			feedId: feedComments.feedId,
			parentId: feedComments.parentId,
			authorId: feedComments.authorId,
			authorName: user.name,
			content: feedComments.content,
			createdAt: feedComments.createdAt,
		})
		.from(feedComments)
		.innerJoin(user, eq(feedComments.authorId, user.id))
		.where(eq(feedComments.feedId, feedId))
		.orderBy(asc(feedComments.createdAt))) as FeedCommentView[];

	const threads = rows.filter((row) => !row.parentId).map((row) => ({ ...row, replies: [] as FeedCommentView[] }));
	const byId = new Map(threads.map((thread) => [thread.id, thread]));
	for (const row of rows) {
		if (row.parentId) byId.get(row.parentId)?.replies.push(row);
	}
	return threads;
}

/** 내가 빌린 적 있는 책 목록 (피드 작성 선택지) */
export async function listReadBooks(userId: string): Promise<FeedBookOption[]> {
	await ensureDatabase();
	return getDb()
		.selectDistinctOn([books.id], {
			id: books.id,
			title: books.title,
			author: books.author,
			coverImageUrl: books.coverImageUrl,
		})
		.from(loans)
		.innerJoin(books, eq(loans.bookId, books.id))
		.where(and(eq(loans.borrowerId, userId), inArray(loans.status, READ_LOAN_STATUSES)))
		.orderBy(books.id);
}

async function requireReadBook(userId: string, bookId: string) {
	const rows = await getDb()
		.select({ id: loans.id })
		.from(loans)
		.where(and(eq(loans.borrowerId, userId), eq(loans.bookId, bookId), inArray(loans.status, READ_LOAN_STATUSES)))
		.limit(1);
	if (!rows.length) throw new FeedError('내가 빌린 책에만 피드를 쓸 수 있어요.', 403);
}

async function requireAuthor(feedId: string, userId: string) {
	const [feed] = await getDb().select({ authorId: feeds.authorId }).from(feeds).where(eq(feeds.id, feedId)).limit(1);
	if (!feed) throw new FeedError('피드를 찾을 수 없어요.', 404);
	if (feed.authorId !== userId) throw new FeedError('작성자만 수정하거나 삭제할 수 있어요.', 403);
}

export async function createFeed(input: FeedInput, authorId: string) {
	await ensureDatabase();
	await requireReadBook(authorId, input.bookId);
	const [created] = await getDb()
		.insert(feeds)
		.values({ ...input, authorId })
		.returning({ id: feeds.id });
	return created;
}

export async function updateFeed(feedId: string, input: FeedInput, userId: string) {
	await ensureDatabase();
	await requireAuthor(feedId, userId);
	await requireReadBook(userId, input.bookId);
	await getDb()
		.update(feeds)
		.set({ ...input, updatedAt: new Date() })
		.where(eq(feeds.id, feedId));
	return { id: feedId };
}

export async function deleteFeed(feedId: string, userId: string) {
	await ensureDatabase();
	await requireAuthor(feedId, userId);
	await getDb().delete(feeds).where(eq(feeds.id, feedId));
}

export async function createFeedComment(feedId: string, input: { content: string; parentId?: string }, authorId: string) {
	await ensureDatabase();
	const db = getDb();
	const [feed] = await db.select({ id: feeds.id }).from(feeds).where(eq(feeds.id, feedId)).limit(1);
	if (!feed) throw new FeedError('피드를 찾을 수 없어요.', 404);

	let parentId: string | null = null;
	if (input.parentId) {
		const [parent] = await db
			.select({ id: feedComments.id, feedId: feedComments.feedId, parentId: feedComments.parentId })
			.from(feedComments)
			.where(eq(feedComments.id, input.parentId))
			.limit(1);
		if (!parent || parent.feedId !== feedId) throw new FeedError('답글을 달 댓글을 찾을 수 없어요.', 404);
		// 중첩은 1단계까지. 대댓글에 답글을 달면 같은 스레드의 최상위 댓글에 붙인다.
		parentId = parent.parentId ?? parent.id;
	}

	const [created] = await db.insert(feedComments).values({ feedId, authorId, content: input.content, parentId }).returning({ id: feedComments.id });
	return created;
}

export async function deleteFeedComment(commentId: string, userId: string) {
	await ensureDatabase();
	const [comment] = await getDb().select({ authorId: feedComments.authorId }).from(feedComments).where(eq(feedComments.id, commentId)).limit(1);
	if (!comment) throw new FeedError('댓글을 찾을 수 없어요.', 404);
	if (comment.authorId !== userId) throw new FeedError('작성자만 삭제할 수 있어요.', 403);
	await getDb().delete(feedComments).where(eq(feedComments.id, commentId));
}
