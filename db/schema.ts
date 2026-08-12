import { boolean, check, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(table) => [index('session_user_id_idx').on(table.userId)],
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
			withTimezone: true,
		}),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('account_user_id_idx').on(table.userId), index('account_provider_account_idx').on(table.providerId, table.accountId)],
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const books = pgTable(
	'books',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: text('title').notNull(),
		author: text('author').notNull(),
		description: text('description'),
		coverImageUrl: text('cover_image_url'),
		publisher: text('publisher'),
		isbn: text('isbn'),
		publishedAt: text('published_at'),
		sourceLink: text('source_link'),
		location: text('location'),
		status: text('status').default('AVAILABLE').notNull(),
		currentBorrowerId: text('current_borrower_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		currentBorrowerName: text('current_borrower_name'),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('books_owner_id_idx').on(table.ownerId),
		index('books_isbn_idx').on(table.isbn),
		index('books_created_at_idx').on(table.createdAt),
		index('books_status_created_at_idx').on(table.status, table.createdAt),
		index('books_current_borrower_id_idx').on(table.currentBorrowerId),
		check('books_status_check', sql`${table.status} in ('AVAILABLE', 'BORROWED', 'UNAVAILABLE')`),
	],
);

export const loans = pgTable(
	'loans',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'restrict' }),
		borrowerId: text('borrower_id')
			.notNull()
			.references(() => user.id, { onDelete: 'restrict' }),
		status: text('status').default('REQUESTED').notNull(),
		requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
		approvedAt: timestamp('approved_at', { withTimezone: true }),
		borrowedAt: timestamp('borrowed_at', { withTimezone: true }),
		returnRequestedAt: timestamp('return_requested_at', { withTimezone: true }),
		returnedAt: timestamp('returned_at', { withTimezone: true }),
		resolvedAt: timestamp('resolved_at', { withTimezone: true }),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('loans_book_id_idx').on(table.bookId),
		index('loans_borrower_id_idx').on(table.borrowerId),
		index('loans_status_requested_at_idx').on(table.status, table.requestedAt),
		uniqueIndex('loans_one_current_borrower_idx')
			.on(table.bookId)
			.where(sql`${table.status} in ('APPROVED', 'BORROWED', 'RETURN_REQUESTED')`),
		uniqueIndex('loans_one_reservation_per_member_idx')
			.on(table.bookId, table.borrowerId)
			.where(sql`${table.status} = 'REQUESTED'`),
		index('loans_book_queue_idx').on(table.bookId, table.status, table.requestedAt),
		check(
			'loans_status_check',
			sql`${table.status} in ('REQUESTED', 'APPROVED', 'REJECTED', 'BORROWED', 'RETURN_REQUESTED', 'RETURNED', 'CANCELLED')`,
		),
	],
);
