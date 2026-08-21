import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteFeed, FeedError, updateFeed } from '@/lib/feed-data';
import { feedSchema } from '@/lib/schemas/feed';
import { getRequestSession } from '@/lib/request-session';

type Context = { params: Promise<{ feedId: string }> };

export async function PATCH(request: Request, context: Context) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

	const { feedId } = await context.params;
	if (!z.uuid().safeParse(feedId).success) return NextResponse.json({ message: '피드를 찾을 수 없어요.' }, { status: 404 });

	const parsed = feedSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ message: '입력 내용을 확인해 주세요.', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
	}

	try {
		return NextResponse.json(await updateFeed(feedId, parsed.data, session.user.id));
	} catch (error) {
		if (error instanceof FeedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}

export async function DELETE(request: Request, context: Context) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

	const { feedId } = await context.params;
	if (!z.uuid().safeParse(feedId).success) return NextResponse.json({ message: '피드를 찾을 수 없어요.' }, { status: 404 });

	try {
		await deleteFeed(feedId, session.user.id);
		return new Response(null, { status: 204 });
	} catch (error) {
		if (error instanceof FeedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}
