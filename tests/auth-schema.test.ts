import { afterEach, describe, expect, it } from 'vitest';
import { getSafeReturnTo, isAllowedEmailDomain, loginSchema, signupSchema } from '@/lib/schemas/auth';

const originalAllowedDomains = process.env.ALLOWED_EMAIL_DOMAINS;

afterEach(() => {
	if (originalAllowedDomains === undefined) {
		delete process.env.ALLOWED_EMAIL_DOMAINS;
	} else {
		process.env.ALLOWED_EMAIL_DOMAINS = originalAllowedDomains;
	}
});

describe('인증 입력 스키마', () => {
	it('올바른 로그인 입력을 허용한다', () => {
		expect(
			loginSchema.safeParse({
				email: 'reader@company.com',
				password: 'Bookclub2026',
			}).success,
		).toBe(true);
	});

	it('영문과 숫자가 없는 비밀번호를 거부한다', () => {
		const result = signupSchema.safeParse({
			name: '김독서',
			email: 'reader@company.com',
			password: '비밀번호입니다',
			passwordConfirm: '비밀번호입니다',
		});

		expect(result.success).toBe(false);
	});

	it('서로 다른 비밀번호 확인을 거부한다', () => {
		const result = signupSchema.safeParse({
			name: '김독서',
			email: 'reader@company.com',
			password: 'Bookclub2026',
			passwordConfirm: 'Bookclub2027',
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.at(0)?.path).toContain('passwordConfirm');
		}
	});
});

describe('인증 보안 유틸리티', () => {
	it('설정된 회사 이메일 도메인만 허용한다', () => {
		process.env.ALLOWED_EMAIL_DOMAINS = 'company.com, team.co.kr';

		expect(isAllowedEmailDomain('reader@company.com')).toBe(true);
		expect(isAllowedEmailDomain('reader@TEAM.CO.KR')).toBe(true);
		expect(isAllowedEmailDomain('reader@personal.com')).toBe(false);
	});

	it('외부 주소로 향하는 로그인 후 이동 경로를 차단한다', () => {
		expect(getSafeReturnTo('/books/new')).toBe('/books/new');
		expect(getSafeReturnTo('//malicious.example')).toBe('/profile');
		expect(getSafeReturnTo('https://malicious.example')).toBe('/profile');
	});
});
