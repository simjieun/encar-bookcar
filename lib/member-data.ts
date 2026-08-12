import 'server-only';

import { asc, ilike, or } from 'drizzle-orm';
import { ensureDatabase, getDb } from '@/db';
import { user } from '@/db/schema';

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
