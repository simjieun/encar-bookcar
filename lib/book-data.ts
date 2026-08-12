import 'server-only';

import { and, asc, count, countDistinct, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { ensureDatabase, getDb } from '@/db';
import { books, user } from '@/db/schema';
import type { BookInput } from '@/lib/schemas/book';

export const BOOK_PAGE_SIZE = 20;

export const bookSelection = {
	id: books.id,
	title: books.title,
	author: books.author,
	description: books.description,
	coverImageUrl: books.coverImageUrl,
	publisher: books.publisher,
	isbn: books.isbn,
	publishedAt: books.publishedAt,
	sourceLink: books.sourceLink,
	location: books.location,
	status: books.status,
	currentBorrowerId: books.currentBorrowerId,
	currentBorrowerName: books.currentBorrowerName,
	ownerId: books.ownerId,
	ownerName: user.name,
	createdAt: books.createdAt,
	updatedAt: books.updatedAt,
};

export async function listBooks(options: { query?: string; status?: string; sort?: 'latest' | 'oldest'; page?: number; limit?: number }) {
	await ensureDatabase();
	const db = getDb();
	const conditions: SQL[] = [];

	if (options.query) {
		const pattern = `%${options.query}%`;
		conditions.push(or(ilike(books.title, pattern), ilike(books.author, pattern))!);
	}
	if (options.status && options.status !== 'ALL') {
		conditions.push(eq(books.status, options.status));
	}

	const limit = options.limit ?? BOOK_PAGE_SIZE;
	const page = options.page ?? 1;
	const rows = await db
		.select(bookSelection)
		.from(books)
		.innerJoin(user, eq(books.ownerId, user.id))
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(options.sort === 'oldest' ? asc(books.createdAt) : desc(books.createdAt))
		.limit(limit + 1)
		.offset((page - 1) * limit);

	return {
		books: rows.slice(0, limit),
		hasMore: rows.length > limit,
		page,
	};
}

export async function getBook(bookId: string) {
	await ensureDatabase();
	const rows = await getDb().select(bookSelection).from(books).innerJoin(user, eq(books.ownerId, user.id)).where(eq(books.id, bookId)).limit(1);

	return rows.at(0) ?? null;
}

export async function getBookStats() {
	await ensureDatabase();
	const db = getDb();
	const [total, owners, available] = await Promise.all([
		db.select({ value: count() }).from(books),
		db.select({ value: countDistinct(books.ownerId) }).from(books),
		db.select({ value: count() }).from(books).where(eq(books.status, 'AVAILABLE')),
	]);

	return {
		total: total[0].value,
		owners: owners[0].value,
		available: available[0].value,
	};
}

export function toBookRecord(input: BookInput) {
	return {
		title: input.title,
		author: input.author,
		description: input.description || null,
		coverImageUrl: input.coverImageUrl || null,
		publisher: input.publisher || null,
		isbn: input.isbn || null,
		publishedAt: input.publishedAt || null,
		sourceLink: input.sourceLink || null,
		location: input.location || null,
		status: input.status,
		currentBorrowerId: input.status === 'BORROWED' ? input.currentBorrowerId || null : null,
		currentBorrowerName: input.status === 'BORROWED' ? input.currentBorrowerName || null : null,
		updatedAt: new Date(),
	};
}
