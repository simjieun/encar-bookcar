import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createFeedComment, FeedError } from '@/lib/feed-data';
import { feedCommentSchema } from '@/lib/schemas/feed';
import { getRequestSession } from '@/lib/request-session';

export async function POST(request: Request, context: { params: Promise<{ feedId: string }> }) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '댓글을 쓰려면 먼저 로그인해 주세요.' }, { status: 401 });

	const { feedId } = await context.params;
	if (!z.uuid().safeParse(feedId).success) return NextResponse.json({ message: '피드를 찾을 수 없어요.' }, { status: 404 });

	const parsed = feedCommentSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ message: parsed.error.issues[0]?.message ?? '입력 내용을 확인해 주세요.' }, { status: 400 });
	}

	try {
		const created = await createFeedComment(feedId, parsed.data, session.user.id);
		return NextResponse.json({ id: created.id }, { status: 201 });
	} catch (error) {
		if (error instanceof FeedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}
