import { NextResponse } from 'next/server';
import { z } from 'zod';
import { searchMembers } from '@/lib/member-data';
import { getRequestSession } from '@/lib/request-session';

export const dynamic = 'force-dynamic';

const querySchema = z.string().trim().max(100).default('');

export async function GET(request: Request) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });
	const parsed = querySchema.safeParse(new URL(request.url).searchParams.get('query') ?? '');
	if (!parsed.success) return NextResponse.json({ message: '검색어를 확인해 주세요.' }, { status: 400 });
	return NextResponse.json({ members: await searchMembers(parsed.data) });
}
