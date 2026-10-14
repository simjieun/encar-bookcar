import { NextResponse } from 'next/server';
import { createWantedBook, listWantedBooks, WantedError } from '@/lib/wanted-data';
import { wantedBookSchema, wantedListQuerySchema } from '@/lib/schemas/wanted';
import { getRequestSession } from '@/lib/request-session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	const parsed = wantedListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
	if (!parsed.success) {
		return NextResponse.json({ message: '목록 조건을 다시 확인해 주세요.' }, { status: 400 });
	}

	return NextResponse.json(await listWantedBooks(parsed.data));
}

export async function POST(request: Request) {
	const session = await getRequestSession(request);
	if (!session) {
		return NextResponse.json({ message: '책을 찾으려면 먼저 로그인해 주세요.' }, { status: 401 });
	}

	const parsed = wantedBookSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ message: parsed.error.issues[0]?.message ?? '입력 내용을 확인해 주세요.' }, { status: 400 });
	}

	try {
		const created = await createWantedBook(parsed.data, session.user.id);
		return NextResponse.json({ id: created.id }, { status: 201 });
	} catch (error) {
		if (error instanceof WantedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}
