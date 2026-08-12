import 'server-only';

import { ensureDatabase } from '@/db';
import { auth } from '@/lib/auth';

export async function getRequestSession(request: Request) {
	await ensureDatabase();
	return auth.api.getSession({ headers: request.headers });
}
