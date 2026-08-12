import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '@/db';
import { isAllowedEmailDomain } from '@/lib/schemas/auth';

const developmentSecret = 'encar-bookcar-local-development-secret-change-before-production';

if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
	throw new Error('운영 환경에는 BETTER_AUTH_SECRET이 필요합니다.');
}

export const auth = betterAuth({
	appName: '엔카북카',
	baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
	secret: process.env.BETTER_AUTH_SECRET ?? developmentSecret,
	database: drizzleAdapter(getDb(), {
		provider: 'pg',
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
	},
	rateLimit: {
		enabled: true,
		window: 60,
		max: 100,
		customRules: {
			'/sign-in/email': { window: 60, max: 10 },
			'/sign-up/email': { window: 60, max: 5 },
		},
	},
	trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
	advanced: {
		cookiePrefix: 'encar-bookcar',
		useSecureCookies: process.env.NODE_ENV === 'production',
	},
	hooks: {
		before: createAuthMiddleware(async (context) => {
			if (context.path !== '/sign-up/email') {
				return;
			}

			const body = context.body as { email?: string; password?: string } | undefined;
			const password = body?.password ?? '';

			if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
				throw new APIError('BAD_REQUEST', {
					message: '비밀번호에 영문과 숫자를 하나 이상 포함해 주세요.',
				});
			}

			if (body?.email && !isAllowedEmailDomain(body.email)) {
				throw new APIError('BAD_REQUEST', {
					message: '회사에서 허용한 이메일로 가입해 주세요.',
				});
			}
		}),
	},
});
