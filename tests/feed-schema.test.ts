import { describe, expect, it } from 'vitest';
import { toExcerpt } from '@/components/feeds/feed-card';
import { feedCommentSchema, feedSchema } from '@/lib/schemas/feed';

const validFeed = {
	bookId: '2f0f5c58-8f7e-4f3e-9f6a-9d1a8f6b3c11',
	title: '읽고 나서 팀 회고가 달라졌어요',
	content: '## 좋았던 점\n\n짧게 읽히는데 남는 게 많다.',
};

describe('피드 입력 검증', () => {
	it('책과 제목, 내용이 채워진 입력을 허용한다', () => {
		expect(feedSchema.safeParse(validFeed).success).toBe(true);
	});

	it('책을 고르지 않았거나 내용이 비면 거부한다', () => {
		expect(feedSchema.safeParse({ ...validFeed, bookId: '' }).success).toBe(false);
		expect(feedSchema.safeParse({ ...validFeed, content: '   ' }).success).toBe(false);
	});

	it('제목과 내용의 길이 상한을 지킨다', () => {
		expect(feedSchema.safeParse({ ...validFeed, title: 'ㄱ'.repeat(121) }).success).toBe(false);
		expect(feedSchema.safeParse({ ...validFeed, content: 'ㄱ'.repeat(20_001) }).success).toBe(false);
	});

	it('빈 댓글을 거부한다', () => {
		expect(feedCommentSchema.safeParse({ content: '  ' }).success).toBe(false);
		expect(feedCommentSchema.safeParse({ content: '같이 읽고 싶네요' }).success).toBe(true);
	});

	it('parentId 없으면 최상위 댓글로 본다', () => {
		const parsed = feedCommentSchema.safeParse({ content: '최상위' });
		expect(parsed.success && parsed.data.parentId).toBe('');
	});

	it('대댓글의 parentId는 uuid만 허용한다', () => {
		expect(feedCommentSchema.safeParse({ content: '답글', parentId: '2f0f5c58-8f7e-4f3e-9f6a-9d1a8f6b3c11' }).success).toBe(true);
		expect(feedCommentSchema.safeParse({ content: '답글', parentId: 'not-a-uuid' }).success).toBe(false);
	});
});

describe('피드 미리보기', () => {
	it('마크다운 기호를 걷어내고 링크는 글자만 남긴다', () => {
		expect(toExcerpt('## 제목\n\n**굵게** 그리고 [링크](https://example.com)')).toBe('제목 굵게 그리고 링크');
	});

	it('코드 블록을 미리보기에서 제외한다', () => {
		expect(toExcerpt('본문\n\n```js\nconsole.log(1)\n```\n\n끝')).toBe('본문 끝');
	});

	it('길면 말줄임표로 끊는다', () => {
		expect(toExcerpt('가'.repeat(200), 10)).toBe(`${'가'.repeat(10)}…`);
	});
});
