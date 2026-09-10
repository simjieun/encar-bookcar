import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { books, loans, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { listBooks, toBookRecord } from '@/lib/book-data';
import { findMemberIdByExactName } from '@/lib/member-data';
import { bookListQuerySchema, bookSchema } from '@/lib/schemas/book';
import { getRequestSession } from '@/lib/request-session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	const searchParams = Object.fromEntries(new URL(request.url).searchParams);
	const parsed = bookListQuerySchema.safeParse(searchParams);
	if (!parsed.success) {
		return NextResponse.json({ message: '검색 조건을 다시 확인해 주세요.' }, { status: 400 });
	}

	return NextResponse.json(await listBooks(parsed.data));
}

export async function POST(request: Request) {
	const session = await getRequestSession(request);
	if (!session) {
		return NextResponse.json({ message: '책을 등록하려면 먼저 로그인해 주세요.' }, { status: 401 });
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

	// 검색 결과를 누르지 않고 이름만 입력해도 회원이면 연결해야 loans 행이 생겨 대여 현황에 보인다
	if (parsed.data.status === 'BORROWED' && !parsed.data.currentBorrowerId && parsed.data.currentBorrowerName) {
		parsed.data.currentBorrowerId = await findMemberIdByExactName(parsed.data.currentBorrowerName);
	}

	// ponytail: 등록자 본인도 대여자로 지정 가능 (책을 직접 들고 있는 경우)
	const result = await getDb().transaction(async (tx) => {
		if (parsed.data.currentBorrowerId) {
			const member = await tx.select({ id: user.id }).from(user).where(eq(user.id, parsed.data.currentBorrowerId)).limit(1);
			if (!member.length) return null;
		}
		const [created] = await tx
			.insert(books)
			.values({ ...toBookRecord(parsed.data), ownerId: session.user.id })
			.returning({ id: books.id });
		if (parsed.data.status === 'BORROWED' && parsed.data.currentBorrowerId) {
			await tx.insert(loans).values({
				bookId: created.id,
				borrowerId: parsed.data.currentBorrowerId,
				status: 'BORROWED',
				borrowedAt: new Date(),
			});
		}
		return created;
	});
	if (!result) return NextResponse.json({ message: '선택한 동료를 찾을 수 없어요.' }, { status: 400 });
	return NextResponse.json({ id: result.id }, { status: 201 });
}
