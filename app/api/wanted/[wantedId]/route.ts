import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteWantedBook, updateWantedStatus, WantedError } from '@/lib/wanted-data';
import { wantedStatusUpdateSchema } from '@/lib/schemas/wanted';
import { getRequestSession } from '@/lib/request-session';

type Context = { params: Promise<{ wantedId: string }> };

export async function PATCH(request: Request, context: Context) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

	const { wantedId } = await context.params;
	if (!z.uuid().safeParse(wantedId).success) return NextResponse.json({ message: '요청을 찾을 수 없어요.' }, { status: 404 });

	const parsed = wantedStatusUpdateSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return NextResponse.json({ message: '바꿀 상태를 확인해 주세요.' }, { status: 400 });

	try {
		await updateWantedStatus(wantedId, parsed.data.status, session.user.id);
		return new Response(null, { status: 204 });
	} catch (error) {
		if (error instanceof WantedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}

export async function DELETE(request: Request, context: Context) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

	const { wantedId } = await context.params;
	if (!z.uuid().safeParse(wantedId).success) return NextResponse.json({ message: '요청을 찾을 수 없어요.' }, { status: 404 });

	try {
		await deleteWantedBook(wantedId, { id: session.user.id, isAdmin: session.user.role === 'admin' });
		return new Response(null, { status: 204 });
	} catch (error) {
		if (error instanceof WantedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}
