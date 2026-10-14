import { z } from 'zod';
import { optionalUrl } from './book';

export const wantedStatusSchema = z.enum(['OPEN', 'FOUND']);

/** 책 정보는 카카오 검색 결과에서 채워지고, 사람이 쓰는 건 한마디뿐이다. */
export const wantedBookSchema = z.object({
	title: z.string().trim().min(1, '찾는 책을 먼저 선택해 주세요.').max(150, '책 제목은 150자 이하로 입력해 주세요.').prefault(''),
	author: z.string().trim().min(1, '저자를 입력해 주세요.').max(120, '저자는 120자 이하로 입력해 주세요.').prefault(''),
	publisher: z.string().trim().max(100).default(''),
	isbn: z.string().trim().max(40).default(''),
	coverImageUrl: optionalUrl.default(''),
	publishedAt: z.string().trim().max(8).default(''),
	sourceLink: optionalUrl.default(''),
	message: z.string().trim().max(500, '한마디는 500자 이하로 입력해 주세요.').default(''),
});

export const wantedListQuerySchema = z.object({
	status: z.enum(['OPEN', 'FOUND', 'ALL']).default('OPEN'),
	page: z.coerce.number().int().min(1).max(1000).default(1),
});

export const wantedStatusUpdateSchema = z.object({
	status: wantedStatusSchema,
});

export type WantedBookInput = z.infer<typeof wantedBookSchema>;
export type WantedStatus = z.infer<typeof wantedStatusSchema>;
export type WantedListFilter = z.infer<typeof wantedListQuerySchema>['status'];
