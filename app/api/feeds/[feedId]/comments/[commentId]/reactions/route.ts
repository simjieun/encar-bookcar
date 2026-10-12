import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FeedError, toggleFeedCommentReaction } from '@/lib/feed-data';
import { feedReactionSchema } from '@/lib/schemas/feed';
import { getRequestSession } from '@/lib/request-session';

export async function POST(request: Request, context: { params: Promise<{ feedId: string; commentId: string }> }) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '반응을 남기려면 먼저 로그인해 주세요.' }, { status: 401 });

	const { feedId, commentId } = await context.params;
	if (!z.uuid().safeParse(feedId).success || !z.uuid().safeParse(commentId).success) {
		return NextResponse.json({ message: '댓글을 찾을 수 없어요.' }, { status: 404 });
	}

	const parsed = feedReactionSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ message: parsed.error.issues[0]?.message ?? '입력 내용을 확인해 주세요.' }, { status: 400 });
	}

	try {
		return NextResponse.json(await toggleFeedCommentReaction(feedId, commentId, parsed.data.emoji, session.user.id));
	} catch (error) {
		if (error instanceof FeedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}
