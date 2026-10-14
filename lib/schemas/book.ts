import { z } from 'zod';

export const bookStatusSchema = z.enum(['AVAILABLE', 'BORROWED', 'UNAVAILABLE']);
export const bookOwnershipSchema = z.enum(['CLUB', 'PERSONAL']);

export const optionalUrl = z
	.string()
	.trim()
	.max(500, 'URL이 너무 길어요.')
	.refine((value) => !value || z.url().safeParse(value).success, {
		message: '올바른 URL을 입력해 주세요.',
	});

export const bookSchema = z
	.object({
		title: z.string().trim().min(1, '책 제목을 입력해 주세요.').max(150, '책 제목은 150자 이하로 입력해 주세요.'),
		author: z.string().trim().min(1, '저자를 입력해 주세요.').max(120, '저자는 120자 이하로 입력해 주세요.'),
		description: z.string().trim().max(2_000, '책 소개는 2,000자 이하로 입력해 주세요.'),
		coverImageUrl: optionalUrl,
		publisher: z.string().trim().max(100),
		isbn: z.string().trim().max(40),
		publishedAt: z
			.string()
			.trim()
			.refine((value) => !value || /^\d{8}$/.test(value), {
				message: '출간일은 YYYYMMDD 형식이어야 해요.',
			}),
		sourceLink: optionalUrl,
		location: z.string().trim().max(100, '보관 장소는 100자 이하로 입력해 주세요.'),
		status: bookStatusSchema,
		ownership: bookOwnershipSchema,
		recommendation: z.string().trim().max(80, '추천 한마디는 80자 이하로 입력해 주세요.'),
		currentBorrowerId: z.string().trim().max(128),
		currentBorrowerName: z.string().trim().max(80, '대여자 이름은 80자 이하로 입력해 주세요.'),
	})
	.superRefine((book, context) => {
		if (book.status === 'BORROWED' && !book.currentBorrowerName) {
			context.addIssue({
				code: 'custom',
				path: ['currentBorrowerName'],
				message: '현재 대여자를 입력해 주세요.',
			});
		}
	});

export const bookListQuerySchema = z.object({
	query: z.string().trim().max(100).default(''),
	status: z.enum(['ALL', 'AVAILABLE', 'BORROWED', 'UNAVAILABLE']).default('ALL'),
	ownership: z.enum(['ALL', 'CLUB', 'PERSONAL']).default('ALL'),
	sort: z.enum(['latest', 'oldest']).default('latest'),
	page: z.coerce.number().int().min(1).max(1000).default(1),
});

export const bookOwnershipTransferSchema = z
	.object({
		bookIds: z.array(z.uuid()).min(1, '이관할 책을 선택해 주세요.').max(500),
		ownership: bookOwnershipSchema,
		ownerId: z.string().trim().max(128),
	})
	.superRefine((input, context) => {
		if (input.ownership === 'PERSONAL' && !input.ownerId) {
			context.addIssue({ code: 'custom', path: ['ownerId'], message: '책을 소장한 동료를 선택해 주세요.' });
		}
	});

export const kakaoBookQuerySchema = z.object({
	query: z.string().trim().min(2, '검색어를 두 글자 이상 입력해 주세요.').max(100),
});

export const kakaoBookDocumentSchema = z.object({
	title: z.string(),
	contents: z.string(),
	url: z.string(),
	isbn: z.string(),
	datetime: z.string(),
	authors: z.array(z.string()),
	publisher: z.string(),
	translators: z.array(z.string()),
	price: z.number(),
	sale_price: z.number(),
	thumbnail: z.string(),
	status: z.string(),
});

export const kakaoBookResponseSchema = z.object({
	meta: z.object({
		total_count: z.number(),
		pageable_count: z.number(),
		is_end: z.boolean(),
	}),
	documents: z.array(kakaoBookDocumentSchema),
});

export type BookInput = z.infer<typeof bookSchema>;
export type BookStatus = z.infer<typeof bookStatusSchema>;
export type BookOwnership = z.infer<typeof bookOwnershipSchema>;
export type BookOwnershipTransfer = z.infer<typeof bookOwnershipTransferSchema>;

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
	AVAILABLE: '대여 가능',
	BORROWED: '대여 중',
	UNAVAILABLE: '대여 불가',
};

export const BOOK_OWNERSHIP_LABELS: Record<BookOwnership, string> = {
	CLUB: '북클럽 책',
	PERSONAL: '개인 소장',
};
