import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'node:path';
import postgres from 'postgres';
import * as schema from './schema';

type Database = ReturnType<typeof drizzle<typeof schema>>;

const databaseState = globalThis as typeof globalThis & {
	encarBookcarLocalDb?: Database;
	encarBookcarFifoMigration?: Promise<void>;
};

function createDatabase() {
	const url = process.env.DATABASE_URL;

	if (!url && process.env.NEXT_PHASE !== 'phase-production-build') {
		throw new Error('DATABASE_URL 환경 변수가 필요합니다. .env.local에 PostgreSQL 연결 문자열을 설정해 주세요.');
	}

	// postgres-js는 연결이 lazy라서 쿼리 전까지 접속하지 않는다.
	// 덕분에 빌드 단계에서는 더미 URL만으로도 DB 없이 next build가 통과한다.
	const client = postgres(url ?? 'postgres://localhost:5432/encar_bookcar', {
		// Supabase 트랜잭션 풀러(pgbouncer)는 prepared statement를 지원하지 않는다.
		prepare: false,
	});

	return drizzle(client, { schema });
}

export function getDb() {
	if (!databaseState.encarBookcarLocalDb) {
		databaseState.encarBookcarLocalDb = createDatabase();
	}

	return databaseState.encarBookcarLocalDb;
}

// ponytail: 런타임 마이그레이션. drizzle migrator는 멱등이고 globalThis에 캐시되지만
// 인스턴스 여러 개가 동시에 콜드 스타트하면 경합할 수 있다. 문제가 되면 배포 파이프라인에서
// `npm run db:migrate`를 돌리고 이 함수를 no-op으로 바꾼다.
export async function ensureDatabase() {
	if (!databaseState.encarBookcarFifoMigration) {
		databaseState.encarBookcarFifoMigration = migrate(getDb(), {
			migrationsFolder: path.join(process.cwd(), 'drizzle'),
		}).catch((error) => {
			databaseState.encarBookcarFifoMigration = undefined;
			throw error;
		});
	}

	await databaseState.encarBookcarFifoMigration;
}
