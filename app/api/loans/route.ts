import { NextResponse } from 'next/server';
import { listLoansForUser, LoanError, requestLoan } from '@/lib/loan-data';
import { loanRequestSchema } from '@/lib/schemas/loan';
import { getRequestSession } from '@/lib/request-session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	const session = await getRequestSession(request);
	if (!session) {
		return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });
	}
	return NextResponse.json(await listLoansForUser(session.user.id));
}

export async function POST(request: Request) {
	const session = await getRequestSession(request);
	if (!session) {
		return NextResponse.json({ message: '책을 빌리려면 먼저 로그인해 주세요.' }, { status: 401 });
	}

	const parsed = loanRequestSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json(
			{
				message: parsed.error.issues[0]?.message ?? '책을 다시 선택해 주세요.',
			},
			{ status: 400 },
		);
	}

	try {
		const created = await requestLoan(parsed.data.bookId, session.user.id);
		return NextResponse.json(created, { status: 201 });
	} catch (error) {
		if (error instanceof LoanError) {
			return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
		}
		throw error;
	}
}
