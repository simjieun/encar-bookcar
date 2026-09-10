import 'server-only';

import { asc, eq, ilike, or } from 'drizzle-orm';
import { ensureDatabase, getDb } from '@/db';
import { user } from '@/db/schema';

export async function listMembers() {
	await ensureDatabase();
	return getDb()
		.select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
		.from(user)
		.orderBy(asc(user.name));
}

export async function searchMembers(query: string) {
	await ensureDatabase();
	const pattern = `%${query}%`;
	return getDb()
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(query ? or(ilike(user.name, pattern), ilike(user.email, pattern)) : undefined)
		.orderBy(asc(user.name))
		.limit(20);
}

// ponytail: 이름이 회원 1명과 정확히 일치하면 그 회원으로 본다. 동명의 비회원이 있으면 잘못 연결될 수 있음 — 문제 되면 UI에서 회원 선택을 강제
export async function findMemberIdByExactName(name: string) {
	const rows = await getDb().select({ id: user.id }).from(user).where(eq(user.name, name.trim())).limit(2);
	return rows.length === 1 ? rows[0].id : '';
}
