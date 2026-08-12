import { defineConfig } from 'vitest/config';
import { existsSync } from 'node:fs';
import path from 'node:path';

// vitest는 next와 달리 .env.local을 자동으로 읽지 않는다 (Node 22 내장 API, dotenv 불필요).
if (existsSync('.env.local')) {
	process.loadEnvFile('.env.local');
}

// 테스트는 실제 행을 insert하므로 운영 DATABASE_URL은 절대 넘겨받지 않는다.
// TEST_DATABASE_URL이 없으면 빈 값이 되어 DB를 쓰는 테스트만 명확한 에러로 실패한다.
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? '';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '.'),
			'server-only': path.resolve(__dirname, 'tests/server-only.ts'),
		},
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./tests/setup.ts'],
		env: { DATABASE_URL: testDatabaseUrl },
	},
});
