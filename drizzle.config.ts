import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle',
	schema: './db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		// 마이그레이션은 DDL과 advisory lock을 쓰므로 풀러가 아닌 direct 연결을 사용한다.
		url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? 'postgres://localhost:5432/encar_bookcar',
	},
});
