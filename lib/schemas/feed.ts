import { z } from 'zod';

export const feedSchema = z.object({
	bookId: z.uuid('피드를 쓸 책을 선택해 주세요.'),
	title: z.string().trim().min(1, '제목을 입력해 주세요.').max(120, '제목은 120자 이하로 입력해 주세요.'),
	content: z.string().trim().min(1, '내용을 입력해 주세요.').max(20_000, '내용은 20,000자 이하로 입력해 주세요.'),
});

export const feedListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).max(1000).default(1),
});

export const feedCommentSchema = z.object({
	content: z.string().trim().min(1, '댓글을 입력해 주세요.').max(1_000, '댓글은 1,000자 이하로 입력해 주세요.'),
	// 대댓글이면 부모 댓글 id. 빈 문자열은 최상위 댓글로 본다.
	parentId: z
		.string()
		.trim()
		.max(64)
		.refine((value) => !value || z.uuid().safeParse(value).success, { message: '답글을 달 댓글을 찾을 수 없어요.' })
		.default(''),
});

export type FeedInput = z.infer<typeof feedSchema>;
export type FeedCommentInput = z.infer<typeof feedCommentSchema>;
