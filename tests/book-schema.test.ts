import { describe, expect, it } from 'vitest';
import { bookListQuerySchema, bookSchema, kakaoBookQuerySchema } from '@/lib/schemas/book';

const validBook = {
	title: '소년이 온다',
	author: '한강',
	description: '한강 장편소설',
	coverImageUrl: 'https://search1.kakaocdn.net/thumb/example.jpg',
	publisher: '창비',
	isbn: '9788936434120',
	publishedAt: '20140519',
	sourceLink: 'https://search.daum.net/search?w=bookpage&bookId=1',
	location: '판교 오피스',
	status: 'AVAILABLE',
	currentBorrowerId: '',
	currentBorrowerName: '',
};

describe('도서 입력 검증', () => {
	it('카카오 도서 정보를 포함한 정상 입력을 허용한다', () => {
		expect(bookSchema.safeParse(validBook).success).toBe(true);
	});

	it('잘못된 상태와 출간일을 거부한다', () => {
		expect(
			bookSchema.safeParse({
				...validBook,
				status: 'LOST',
				publishedAt: '2026-08-11',
			}).success,
		).toBe(false);
	});

	it('대여 중으로 등록할 때 현재 대여자를 요구한다', () => {
		expect(bookSchema.safeParse({ ...validBook, status: 'BORROWED' }).success).toBe(false);
		expect(
			bookSchema.safeParse({
				...validBook,
				status: 'BORROWED',
				currentBorrowerId: 'better-auth-text-id',
				currentBorrowerName: '김독서',
			}).success,
		).toBe(true);
	});

	it('책 검색어는 두 글자 이상이어야 한다', () => {
		expect(kakaoBookQuerySchema.safeParse({ query: '책' }).success).toBe(false);
		expect(kakaoBookQuerySchema.safeParse({ query: '한강' }).success).toBe(true);
	});

	it('목록 검색 기본값을 안전하게 적용한다', () => {
		expect(bookListQuerySchema.parse({})).toEqual({
			query: '',
			status: 'ALL',
			sort: 'latest',
			page: 1,
		});
	});
});
