import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteFeedComment, FeedError, updateFeedComment } from '@/lib/feed-data';
import { feedCommentUpdateSchema } from '@/lib/schemas/feed';
import { getRequestSession } from '@/lib/request-session';

export async function PATCH(request: Request, context: { params: Promise<{ feedId: string; commentId: string }> }) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

	const { feedId, commentId } = await context.params;
	if (!z.uuid().safeParse(feedId).success || !z.uuid().safeParse(commentId).success) {
		return NextResponse.json({ message: '댓글을 찾을 수 없어요.' }, { status: 404 });
	}

	const parsed = feedCommentUpdateSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ message: parsed.error.issues[0]?.message ?? '입력 내용을 확인해 주세요.' }, { status: 400 });
	}

	try {
		await updateFeedComment(feedId, commentId, parsed.data.content, session.user.id);
		return new Response(null, { status: 204 });
	} catch (error) {
		if (error instanceof FeedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}

export async function DELETE(request: Request, context: { params: Promise<{ commentId: string }> }) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

	const { commentId } = await context.params;
	if (!z.uuid().safeParse(commentId).success) return NextResponse.json({ message: '댓글을 찾을 수 없어요.' }, { status: 404 });

	try {
		await deleteFeedComment(commentId, session.user.id);
		return new Response(null, { status: 204 });
	} catch (error) {
		if (error instanceof FeedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}
