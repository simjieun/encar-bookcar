import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db';
import { books, loans } from '@/db/schema';
import { getBook, toBookRecord } from '@/lib/book-data';
import { hasBookFeed } from '@/lib/feed-data';
import { hasActiveLoan, hasLoanHistory } from '@/lib/loan-data';
import { bookSchema } from '@/lib/schemas/book';
import { getRequestSession } from '@/lib/request-session';

const bookIdSchema = z.uuid();

type Context = { params: Promise<{ bookId: string }> };

export async function GET(_request: Request, context: Context) {
	const { bookId } = await context.params;
	if (!bookIdSchema.safeParse(bookId).success) {
		return NextResponse.json({ message: '책을 찾을 수 없어요.' }, { status: 404 });
	}

	const book = await getBook(bookId);
	if (!book) {
		return NextResponse.json({ message: '책을 찾을 수 없어요.' }, { status: 404 });
	}
	return NextResponse.json({ book });
}

export async function PATCH(request: Request, context: Context) {
	const session = await getRequestSession(request);
	if (!session) {
		return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });
	}

	const { bookId } = await context.params;
	if (!bookIdSchema.safeParse(bookId).success) {
		return NextResponse.json({ message: '책을 찾을 수 없어요.' }, { status: 404 });
	}
	const current = await getBook(bookId);
	if (!current) {
		return NextResponse.json({ message: '책을 찾을 수 없어요.' }, { status: 404 });
	}
	if (current.ownerId !== session.user.id) {
		return NextResponse.json({ message: '등록한 사람만 수정할 수 있어요.' }, { status: 403 });
	}

	const parsed = bookSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json(
			{
				message: '입력 내용을 확인해 주세요.',
				fieldErrors: parsed.error.flatten().fieldErrors,
			},
			{ status: 400 },
		);
	}

	if (
		parsed.data.currentBorrowerId !== (current.currentBorrowerId ?? '') ||
		parsed.data.currentBorrowerName !== (current.currentBorrowerName ?? '')
	) {
		return NextResponse.json({ message: '대여자는 책 상세 화면에서 변경해 주세요.' }, { status: 409 });
	}

	if (parsed.data.status !== current.status) {
		if (parsed.data.status === 'BORROWED' || (await hasActiveLoan(bookId))) {
			return NextResponse.json({ message: '대여 중인 책의 상태는 대여 현황에서 변경해 주세요.' }, { status: 409 });
		}
	}

	await getDb().update(books).set(toBookRecord(parsed.data)).where(eq(books.id, bookId));
	return NextResponse.json({ id: bookId });
}

export async function DELETE(request: Request, context: Context) {
	const session = await getRequestSession(request);
	if (!session) {
		return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });
	}

	const { bookId } = await context.params;
	if (!bookIdSchema.safeParse(bookId).success) {
		return NextResponse.json({ message: '책을 찾을 수 없어요.' }, { status: 404 });
	}
	const current = await getBook(bookId);
	if (!current) {
		return NextResponse.json({ message: '책을 찾을 수 없어요.' }, { status: 404 });
	}
	const isAdmin = session.user.role === 'admin';
	if (!isAdmin && current.ownerId !== session.user.id) {
		return NextResponse.json({ message: '등록한 사람만 삭제할 수 있어요.' }, { status: 403 });
	}

	if (isAdmin) {
		// 관리자는 대여 이력을 함께 지우지만, 남의 독서 기록까지 지우지는 않는다.
		if (await hasBookFeed(bookId)) {
			return NextResponse.json(
				{ message: '독서 피드가 달린 책이에요. 피드를 먼저 정리한 뒤 삭제해 주세요.' },
				{ status: 409 },
			);
		}
	} else if (await hasLoanHistory(bookId)) {
		return NextResponse.json({ message: '대여 이력이 있는 책은 기록 보존을 위해 삭제할 수 없어요.' }, { status: 409 });
	}

	// loans.book_id가 restrict라 대여 기록을 먼저 지운다. 관리자가 아니면 위 검사로 이미 0건이다.
	await getDb().transaction(async (tx) => {
		await tx.delete(loans).where(eq(loans.bookId, bookId));
		await tx.delete(books).where(eq(books.id, bookId));
	});
	return new Response(null, { status: 204 });
}
