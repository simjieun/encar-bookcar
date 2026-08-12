import { NextResponse } from 'next/server';
import { z } from 'zod';
import { changeBookBorrower, LoanError } from '@/lib/loan-data';
import { borrowerChangeSchema } from '@/lib/schemas/loan';
import { getRequestSession } from '@/lib/request-session';

type Context = { params: Promise<{ bookId: string }> };

export async function PATCH(request: Request, context: Context) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });
	const { bookId } = await context.params;
	if (!z.uuid().safeParse(bookId).success) return NextResponse.json({ message: '책을 찾을 수 없어요.' }, { status: 404 });
	const parsed = borrowerChangeSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? '대여자를 확인해 주세요.' }, { status: 400 });
	try {
		return NextResponse.json(await changeBookBorrower(bookId, session.user.id, parsed.data));
	} catch (error) {
		if (error instanceof LoanError) return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
		throw error;
	}
}
