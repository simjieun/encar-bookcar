import { NextResponse } from 'next/server';
import { z } from 'zod';
import { toggleWantedOffer, WantedError } from '@/lib/wanted-data';
import { getRequestSession } from '@/lib/request-session';

export async function POST(request: Request, context: { params: Promise<{ wantedId: string }> }) {
	const session = await getRequestSession(request);
	if (!session) return NextResponse.json({ message: '먼저 로그인해 주세요.' }, { status: 401 });

	const { wantedId } = await context.params;
	if (!z.uuid().safeParse(wantedId).success) return NextResponse.json({ message: '요청을 찾을 수 없어요.' }, { status: 404 });

	try {
		return NextResponse.json(await toggleWantedOffer(wantedId, session.user.id));
	} catch (error) {
		if (error instanceof WantedError) return NextResponse.json({ message: error.message }, { status: error.status });
		throw error;
	}
}
