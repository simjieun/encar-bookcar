import { describe, expect, it } from 'vitest';
import { wantedBookSchema, wantedListQuerySchema } from '@/lib/schemas/wanted';

// 카카오 검색 결과(KakaoBook)를 그대로 넘기는 모양
const kakaoBook = {
	title: '클린 아키텍처',
	author: '로버트 C. 마틴',
	publisher: '인사이트',
	description: '소개',
	coverImageUrl: 'https://search1.kakaocdn.net/thumb/cover.jpg',
	isbn: '8966262473 9788966262472',
	publishedAt: '20190820',
	sourceLink: 'https://search.daum.net/search?q=book',
};

describe('책 찾아요 입력 검증', () => {
	it('카카오 검색 결과에 한마디를 붙인 입력을 허용한다', () => {
		const parsed = wantedBookSchema.safeParse({ ...kakaoBook, message: '팀에서 자주 얘기해요' });
		expect(parsed.success).toBe(true);
		expect(parsed.data).not.toHaveProperty('description');
	});

	it('한마디 없이도 올릴 수 있다', () => {
		expect(wantedBookSchema.parse(kakaoBook).message).toBe('');
	});

	it('책을 고르지 않으면 거부한다', () => {
		const parsed = wantedBookSchema.safeParse({ message: '아무 책이나' });
		expect(parsed.success).toBe(false);
		expect(parsed.error?.issues[0]?.message).toBe('찾는 책을 먼저 선택해 주세요.');
	});

	it('한마디는 500자까지만 받는다', () => {
		expect(wantedBookSchema.safeParse({ ...kakaoBook, message: '가'.repeat(500) }).success).toBe(true);
		expect(wantedBookSchema.safeParse({ ...kakaoBook, message: '가'.repeat(501) }).success).toBe(false);
	});

	it('목록은 기본으로 찾는 중인 요청만 보여준다', () => {
		expect(wantedListQuerySchema.parse({})).toEqual({ status: 'OPEN', page: 1 });
		expect(wantedListQuerySchema.safeParse({ status: 'DONE' }).success).toBe(false);
	});
});
