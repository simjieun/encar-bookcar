import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReservationQueue } from '@/components/loans/reservation-queue';
import type { LoanView } from '@/lib/types/loan';

function reservation(id: string, borrowerId: string, borrowerName: string, queuePosition: number): LoanView {
	return {
		id,
		bookId: 'book-1',
		bookTitle: '소년이 온다',
		bookAuthor: '한강',
		coverImageUrl: null,
		location: null,
		borrowerId,
		borrowerName,
		ownerId: 'owner',
		ownerName: '김등록',
		status: 'REQUESTED',
		queuePosition,
		requestedAt: '2026-10-02T09:00:00+09:00',
		updatedAt: '2026-10-02T09:00:00+09:00',
	};
}

describe('ReservationQueue', () => {
	it('예약자 전원을 순서대로 보여준다', () => {
		render(<ReservationQueue queue={[reservation('a', 'user-1', '이북카', 1), reservation('b', 'user-2', '박독서', 2)]} />);
		const items = screen.getAllByRole('listitem');
		expect(items[0]).toHaveTextContent('1이북카');
		expect(items[1]).toHaveTextContent('2박독서');
	});
});
