import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import { transferBookOwnership } from '@/lib/book-data';
import { bookOwnershipTransferSchema } from '@/lib/schemas/book';
import { getRequestSession } from '@/lib/request-session';

export async function POST(request: Request) {
	const session = await getRequestSession(request);
	if (session?.user.role !== 'admin') {
		return NextResponse.json({ message: '관리자만 책을 이관할 수 있어요.' }, { status: 403 });
	}

	const parsed = bookOwnershipTransferSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ message: parsed.error.issues[0]?.message ?? '입력 내용을 확인해 주세요.' }, { status: 400 });
	}

	if (parsed.data.ownership === 'PERSONAL') {
		const member = await getDb().select({ id: user.id }).from(user).where(eq(user.id, parsed.data.ownerId)).limit(1);
		if (!member.length) return NextResponse.json({ message: '선택한 동료를 찾을 수 없어요.' }, { status: 400 });
	}

	return NextResponse.json({ updated: await transferBookOwnership(parsed.data) });
}
