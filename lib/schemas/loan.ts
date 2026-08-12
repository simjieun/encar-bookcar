import { z } from 'zod';

export const loanStatusSchema = z.enum(['REQUESTED', 'APPROVED', 'REJECTED', 'BORROWED', 'RETURN_REQUESTED', 'RETURNED', 'CANCELLED']);

export const loanActionSchema = z.enum(['REQUEST_RETURN', 'COMPLETE_RETURN', 'CANCEL']);

export const loanRequestSchema = z.object({
	bookId: z.uuid('올바른 책을 선택해 주세요.'),
});

export const loanTransitionSchema = z.object({
	action: loanActionSchema,
});

export type LoanStatus = z.infer<typeof loanStatusSchema>;
export type LoanAction = z.infer<typeof loanActionSchema>;

export const ACTIVE_LOAN_STATUSES: LoanStatus[] = ['APPROVED', 'BORROWED', 'RETURN_REQUESTED'];

export const RESERVATION_STATUSES: LoanStatus[] = ['REQUESTED'];

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
	REQUESTED: '예약 대기',
	APPROVED: '전달 대기',
	REJECTED: '요청 거절',
	BORROWED: '대여 중',
	RETURN_REQUESTED: '반납 확인 대기',
	RETURNED: '반납 완료',
	CANCELLED: '요청 취소',
};

export const LOAN_ACTION_LABELS: Record<LoanAction, string> = {
	REQUEST_RETURN: '반납 요청',
	COMPLETE_RETURN: '반납 완료',
	CANCEL: '요청 취소',
};

export const borrowerChangeSchema = z
	.object({
		borrowerId: z.string().trim().max(128).default(''),
		borrowerName: z.string().trim().max(80).default(''),
		makeAvailable: z.boolean().default(false),
	})
	.superRefine((value, context) => {
		if (!value.makeAvailable && !value.borrowerName) {
			context.addIssue({
				code: 'custom',
				path: ['borrowerName'],
				message: '새 대여자를 입력해 주세요.',
			});
		}
	});
