import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LoanError, transitionLoan } from '@/lib/loan-data';
import { loanTransitionSchema } from '@/lib/schemas/loan';
import { getRequestSession } from '@/lib/request-session';

const loanIdSchema = z.uuid();
type Context = { params: Promise<{ loanId: string }> };

export async function PATCH(request: Request, context: Context) {
	const session = await getRequestSession(request);
	if (!session) {
		return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });
	}

	const { loanId } = await context.params;
	if (!loanIdSchema.safeParse(loanId).success) {
		return NextResponse.json({ message: '대여 요청을 찾을 수 없어요.' }, { status: 404 });
	}

	const parsed = loanTransitionSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ message: '처리할 작업을 다시 선택해 주세요.' }, { status: 400 });
	}

	try {
		return NextResponse.json(await transitionLoan(loanId, parsed.data.action, session.user.id));
	} catch (error) {
		if (error instanceof LoanError) {
			return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
		}
		throw error;
	}
}
