import { NextResponse } from 'next/server';
import { createFeed, FeedError, listFeeds } from '@/lib/feed-data';
import { feedListQuerySchema, feedSchema } from '@/lib/schemas/feed';
import { getRequestSession } from '@/lib/request-session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	const parsed = feedListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
	if (!parsed.success) {
		return NextResponse.json({ message: '목록 조건을 다시 확인해 주세요.' }, { status: 400 });
	}

	return NextResponse.json(await listFeeds(parsed.data));
}

export async function POST(request: Request) {
	const session = await getRequestSession(request);
	if (!session) {
		return NextResponse.json({ message: '피드를 쓰려면 먼저 로그인해 주세요.' }, { status: 401 });
	}

	const parsed = feedSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ message: '입력 내용을 확인해 주세요.', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
	}

	try {
		const created = await createFeed(parsed.data, session.user.id);
		return NextResponse.json({ id: created.id }, { status: 201 });
	} catch (error) {
		if (error instanceof FeedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}
