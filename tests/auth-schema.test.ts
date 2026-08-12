import { afterEach, describe, expect, it } from 'vitest';
import { changePasswordSchema, createTemporaryPassword, getSafeReturnTo, isAllowedEmailDomain, loginSchema, signupSchema } from '@/lib/schemas/auth';

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

describe('비밀번호 변경 입력 스키마', () => {
	it('현재 비밀번호가 비어 있으면 거부한다', () => {
		const result = changePasswordSchema.safeParse({
			currentPassword: '',
			password: 'Bookclub2026',
			passwordConfirm: 'Bookclub2026',
		});

		expect(result.success).toBe(false);
	});

	it('새 비밀번호에도 가입과 같은 규칙을 적용한다', () => {
		expect(
			changePasswordSchema.safeParse({
				currentPassword: 'Temp1234',
				password: 'Bookclub2026',
				passwordConfirm: 'Bookclub2026',
			}).success,
		).toBe(true);

		expect(
			changePasswordSchema.safeParse({
				currentPassword: 'Temp1234',
				password: '비밀번호입니다',
				passwordConfirm: '비밀번호입니다',
			}).success,
		).toBe(false);
	});

	it('서로 다른 새 비밀번호 확인을 거부한다', () => {
		const result = changePasswordSchema.safeParse({
			currentPassword: 'Temp1234',
			password: 'Bookclub2026',
			passwordConfirm: 'Bookclub2027',
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.at(0)?.path).toContain('passwordConfirm');
		}
	});
});

describe('임시 비밀번호 발급', () => {
	it('가입 비밀번호 규칙을 항상 만족한다', () => {
		// 무작위 생성이라 한 번의 통과로는 부족하다.
		for (let attempt = 0; attempt < 200; attempt += 1) {
			const temporary = createTemporaryPassword();

			expect(
				signupSchema.safeParse({
					name: '김독서',
					email: 'reader@company.com',
					password: temporary,
					passwordConfirm: temporary,
				}).success,
			).toBe(true);
		}
	});

	it('호출할 때마다 다른 값을 만든다', () => {
		const issued = new Set(Array.from({ length: 50 }, () => createTemporaryPassword()));

		expect(issued.size).toBe(50);
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
