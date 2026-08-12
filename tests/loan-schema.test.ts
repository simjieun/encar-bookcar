import { describe, expect, it } from 'vitest';
import { ACTIVE_LOAN_STATUSES, RESERVATION_STATUSES, loanRequestSchema, loanStatusSchema, loanTransitionSchema } from '@/lib/schemas/loan';

describe('대여 요청 검증', () => {
	it('Phase 3의 모든 대여 상태를 허용한다', () => {
		expect(loanStatusSchema.options).toEqual(['REQUESTED', 'APPROVED', 'REJECTED', 'BORROWED', 'RETURN_REQUESTED', 'RETURNED', 'CANCELLED']);
	});

	it('진행 중인 상태와 종료 상태를 구분한다', () => {
		expect(ACTIVE_LOAN_STATUSES).not.toContain('REQUESTED');
		expect(RESERVATION_STATUSES).toContain('REQUESTED');
		expect(ACTIVE_LOAN_STATUSES).toContain('RETURN_REQUESTED');
		expect(ACTIVE_LOAN_STATUSES).not.toContain('RETURNED');
	});

	it('책 ID와 상태 전환 액션을 검증한다', () => {
		expect(loanRequestSchema.safeParse({ bookId: 'not-a-uuid' }).success).toBe(false);
		expect(
			loanRequestSchema.safeParse({
				bookId: '503081b1-dff8-494d-96cf-0732783350ae',
			}).success,
		).toBe(true);
		expect(loanTransitionSchema.safeParse({ action: 'REQUEST_RETURN' }).success).toBe(true);
		expect(loanTransitionSchema.safeParse({ action: 'APPROVE' }).success).toBe(false);
		expect(loanTransitionSchema.safeParse({ action: 'DELETE' }).success).toBe(false);
	});
});
