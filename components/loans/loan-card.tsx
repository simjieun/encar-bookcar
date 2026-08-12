import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { BookCover } from '@/components/books/book-cover';
import { LOAN_STATUS_LABELS } from '@/lib/schemas/loan';
import type { LoanView } from '@/lib/types/loan';
import { LoanActionButton } from './loan-action-button';

export function LoanCard({ loan, role }: { loan: LoanView; role: 'borrower' | 'owner' }) {
	const date = new Intl.DateTimeFormat('ko-KR', {
		month: 'long',
		day: 'numeric',
	}).format(new Date(loan.requestedAt));
	return (
		<article className="loan-card">
			<Link
				className="loan-card-cover"
				href={`/books/${loan.bookId}`}
			>
				<BookCover
					src={loan.coverImageUrl}
					title={loan.bookTitle}
					sizes="80px"
				/>
			</Link>
			<div className="loan-card-content">
				<div className="loan-card-top">
					<span className={`loan-status loan-status-${loan.status.toLowerCase()}`}>
						{loan.queuePosition ? `예약 ${loan.queuePosition}번째` : LOAN_STATUS_LABELS[loan.status]}
					</span>
					<small>{date} 신청</small>
				</div>
				<Link href={`/books/${loan.bookId}`}>
					<h3>{loan.bookTitle}</h3>
					<p>{loan.bookAuthor}</p>
				</Link>
				<p className="loan-person">
					{role === 'borrower' ? `${loan.ownerName}님의 책` : `${loan.borrowerName}님${loan.queuePosition ? '이 예약' : '이 대여'}`}
				</p>
				{loan.location && (
					<p className="loan-location">
						<MapPin size={15} />
						{loan.location}
					</p>
				)}
				<div className="loan-card-actions">
					{role === 'borrower' && loan.status === 'REQUESTED' && (
						<LoanActionButton
							loanId={loan.id}
							action="CANCEL"
							label="예약 취소"
							tone="secondary"
							confirmMessage="예약을 취소할까요?"
						/>
					)}
					{role === 'borrower' && loan.status === 'BORROWED' && (
						<LoanActionButton
							loanId={loan.id}
							action="REQUEST_RETURN"
							label="반납 요청"
						/>
					)}
					{role === 'owner' && loan.status === 'RETURN_REQUESTED' && (
						<LoanActionButton
							loanId={loan.id}
							action="COMPLETE_RETURN"
							label="반납 완료"
							confirmMessage="책을 돌려받았나요?"
						/>
					)}
					<Link
						className="loan-detail-link"
						href={`/books/${loan.bookId}`}
					>
						책 보기 <ArrowUpRight size={15} />
					</Link>
				</div>
			</div>
		</article>
	);
}
