import 'server-only';

import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { ensureDatabase, getDb } from '@/db';
import { books, user, wantedBookOffers, wantedBooks } from '@/db/schema';
import type { WantedBookInput, WantedListFilter, WantedStatus } from '@/lib/schemas/wanted';
import type { WantedBookView, WantedLibraryMatch, WantedOfferView } from '@/lib/types/wanted';

export const WANTED_PAGE_SIZE = 10;

export class WantedError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = 'WantedError';
	}
}

const wantedSelection = {
	id: wantedBooks.id,
	requesterId: wantedBooks.requesterId,
	requesterName: user.name,
	title: wantedBooks.title,
	author: wantedBooks.author,
	publisher: wantedBooks.publisher,
	isbn: wantedBooks.isbn,
	coverImageUrl: wantedBooks.coverImageUrl,
	publishedAt: wantedBooks.publishedAt,
	sourceLink: wantedBooks.sourceLink,
	message: wantedBooks.message,
	status: wantedBooks.status,
	offerCount: sql<number>`(select count(*)::int from ${wantedBookOffers} where ${wantedBookOffers.wantedBookId} = ${wantedBooks.id})`,
	createdAt: wantedBooks.createdAt,
};

function selectWantedBooks() {
	return getDb().select(wantedSelection).from(wantedBooks).innerJoin(user, eq(wantedBooks.requesterId, user.id));
}

/** 카카오 ISBN은 "ISBN10 ISBN13"처럼 공백으로 이어져 온다. 숫자 묶음만 꺼낸다. */
export function isbnTokens(isbn: string | null | undefined) {
	return (isbn ?? '').split(/\s+/).filter((token) => /^[0-9X]{10,13}$/i.test(token));
}

export async function listWantedBooks({ page = 1, limit = WANTED_PAGE_SIZE, status = 'OPEN' }: { page?: number; limit?: number; status?: WantedListFilter } = {}) {
	await ensureDatabase();
	const rows = await selectWantedBooks()
		.where(status === 'ALL' ? undefined : eq(wantedBooks.status, status))
		.orderBy(desc(wantedBooks.createdAt), desc(wantedBooks.id))
		.limit(limit + 1)
		.offset((page - 1) * limit);

	return { wantedBooks: rows.slice(0, limit) as WantedBookView[], hasMore: rows.length > limit, page };
}

export async function getWantedBook(wantedId: string) {
	await ensureDatabase();
	const rows = await selectWantedBooks().where(eq(wantedBooks.id, wantedId)).limit(1);
	return (rows.at(0) as WantedBookView | undefined) ?? null;
}

export async function listWantedOffers(wantedId: string): Promise<WantedOfferView[]> {
	await ensureDatabase();
	return getDb()
		.select({ userId: wantedBookOffers.userId, userName: user.name, createdAt: wantedBookOffers.createdAt })
		.from(wantedBookOffers)
		.innerJoin(user, eq(wantedBookOffers.userId, user.id))
		.where(eq(wantedBookOffers.wantedBookId, wantedId))
		.orderBy(asc(wantedBookOffers.createdAt));
}

/** 같은 ISBN의 책이 이미 서가에 있는지. ISBN이 없으면 제목만으로는 오탐이 많아 찾지 않는다. */
export async function findLibraryMatches(isbn: string | null): Promise<WantedLibraryMatch[]> {
	const tokens = isbnTokens(isbn);
	if (!tokens.length) return [];
	await ensureDatabase();
	// ponytail: books.isbn도 같은 "ISBN10 ISBN13" 형식이라 부분 일치로 찾는다. 서가가 수만 권이 되면 정규화 컬럼을 둔다.
	const rows = await getDb()
		.select({ id: books.id, title: books.title, status: books.status })
		.from(books)
		.where(or(...tokens.map((token) => ilike(books.isbn, `%${token}%`))))
		.limit(5);
	return rows as WantedLibraryMatch[];
}

async function requireWanted(wantedId: string) {
	const [wanted] = await getDb()
		.select({ requesterId: wantedBooks.requesterId, status: wantedBooks.status })
		.from(wantedBooks)
		.where(eq(wantedBooks.id, wantedId))
		.limit(1);
	if (!wanted) throw new WantedError('요청을 찾을 수 없어요.', 404);
	return wanted;
}

export async function createWantedBook(input: WantedBookInput, requesterId: string) {
	await ensureDatabase();
	const db = getDb();
	const sameBook = input.isbn ? eq(wantedBooks.isbn, input.isbn) : eq(wantedBooks.title, input.title);
	const [duplicate] = await db
		.select({ id: wantedBooks.id })
		.from(wantedBooks)
		.where(and(eq(wantedBooks.requesterId, requesterId), eq(wantedBooks.status, 'OPEN'), sameBook))
		.limit(1);
	if (duplicate) throw new WantedError('이미 찾고 있는 책이에요.', 409);

	const [created] = await db
		.insert(wantedBooks)
		.values({
			requesterId,
			title: input.title,
			author: input.author,
			publisher: input.publisher || null,
			isbn: input.isbn || null,
			coverImageUrl: input.coverImageUrl || null,
			publishedAt: input.publishedAt || null,
			sourceLink: input.sourceLink || null,
			message: input.message || null,
		})
		.returning({ id: wantedBooks.id });
	return created;
}

export async function updateWantedStatus(wantedId: string, status: WantedStatus, userId: string) {
	await ensureDatabase();
	const wanted = await requireWanted(wantedId);
	if (wanted.requesterId !== userId) throw new WantedError('요청한 사람만 바꿀 수 있어요.', 403);
	await getDb().update(wantedBooks).set({ status, updatedAt: new Date() }).where(eq(wantedBooks.id, wantedId));
}

export async function deleteWantedBook(wantedId: string, actor: { id: string; isAdmin: boolean }) {
	await ensureDatabase();
	const wanted = await requireWanted(wantedId);
	if (wanted.requesterId !== actor.id && !actor.isAdmin) throw new WantedError('요청한 사람만 삭제할 수 있어요.', 403);
	await getDb().delete(wantedBooks).where(eq(wantedBooks.id, wantedId));
}

/** 다시 누르면 취소된다. 해결된 요청에는 새로 남길 수 없지만 취소는 된다. */
export async function toggleWantedOffer(wantedId: string, userId: string) {
	await ensureDatabase();
	const db = getDb();
	const wanted = await requireWanted(wantedId);
	if (wanted.requesterId === userId) throw new WantedError('내가 찾는 책에는 남길 수 없어요.', 403);

	const key = and(eq(wantedBookOffers.wantedBookId, wantedId), eq(wantedBookOffers.userId, userId));
	const removed = await db.delete(wantedBookOffers).where(key).returning({ userId: wantedBookOffers.userId });
	if (removed.length) return { offered: false };
	if (wanted.status === 'FOUND') throw new WantedError('이미 해결된 요청이에요.', 409);
	await db.insert(wantedBookOffers).values({ wantedBookId: wantedId, userId }).onConflictDoNothing();
	return { offered: true };
}
