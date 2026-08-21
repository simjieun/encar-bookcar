import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteFeedComment, FeedError } from '@/lib/feed-data';
import { getRequestSession } from '@/lib/request-session';

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
