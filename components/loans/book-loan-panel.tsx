import Link from 'next/link';
import { ArrowRight, BookCheck, Clock3, Handshake, ListOrdered, UserRound } from 'lucide-react';
import type { BookStatus } from '@/lib/schemas/book';
import type { LoanView } from '@/lib/types/loan';
import { BorrowerManager } from './borrower-manager';
import { LoanActionButton } from './loan-action-button';

type Props = {
	bookId: string;
	bookStatus: BookStatus;
	ownerId: string;
	currentBorrowerId: string | null;
	currentBorrowerName: string | null;
	viewer: { id: string; name: string } | null;
	currentLoan: LoanView | null;
	queue: LoanView[];
	viewerReservation: LoanView | null;
};

export function BookLoanPanel({
	bookId,
	bookStatus,
	ownerId,
	currentBorrowerId,
	currentBorrowerName,
	viewer,
	currentLoan,
	queue,
	viewerReservation,
}: Props) {
	const borrowed = bookStatus === 'BORROWED';
	if (!viewer)
		return (
			<section className="book-loan-panel">
				<span className="loan-panel-icon">
					<Handshake size={22} />
				</span>
				<div>
					<h2>{borrowed ? '다음 순서를 예약할까요?' : '이 책을 바로 빌려볼까요?'}</h2>
					<p>로그인하면 {borrowed ? '예약 순서에 참여할 수 있어요.' : '바로 대여할 수 있어요.'}</p>
				</div>
				<Link
					className="loan-panel-link"
					href={`/login?returnTo=/books/${bookId}`}
				>
					로그인하기 <ArrowRight size={17} />
				</Link>
			</section>
		);

	const isOwner = viewer.id === ownerId;
	const isCurrentBorrower = currentBorrowerId === viewer.id || currentLoan?.borrowerId === viewer.id;
	// ponytail: 대여자가 비회원(이름만 입력)이면 계정이 없어 아무도 못 넘기므로 등록자가 대신 처리한다
	const canManageBorrower = borrowed && (currentBorrowerId ? isCurrentBorrower : isOwner);
	const loanLabel = borrowed ? `예약하기${queue.length ? ` · ${queue.length + 1}번째` : ' · 1번째'}` : '바로 대여하기';

	if (isCurrentBorrower)
		return (
			<section className="book-loan-panel">
				<span className="loan-panel-icon">
					<UserRound size={22} />
				</span>
				<div className="owner-loan-content">
					<h2>현재 내가 대여 중이에요</h2>
					<p>
						{currentLoan?.status === 'RETURN_REQUESTED'
							? '등록자가 책을 확인하면 다음 순서로 넘어가요.'
							: '다 읽었다면 반납을 요청하거나, 다음 동료에게 바로 넘겨주세요.'}
					</p>
					<div className="loan-panel-actions">
						{currentLoan?.status === 'BORROWED' && (
							<LoanActionButton
								loanId={currentLoan.id}
								action="REQUEST_RETURN"
								label="반납 요청"
							/>
						)}
						<Link
							className="loan-panel-link subtle"
							href="/loans"
						>
							내 대여 현황 <ArrowRight size={17} />
						</Link>
					</div>
					{canManageBorrower && (
						<BorrowerManager
							bookId={bookId}
							currentBorrowerName={currentBorrowerName}
							queue={queue}
						/>
					)}
				</div>
			</section>
		);

	if (viewerReservation)
		return (
			<section className="book-loan-panel">
				<span className="loan-panel-icon">
					<ListOrdered size={22} />
				</span>
				<div>
					<h2>예약 {viewerReservation.queuePosition}번째예요</h2>
					<p>앞선 대여가 끝나면 순서대로 자동 연결돼요.</p>
				</div>
				<div className="loan-panel-actions">
					<LoanActionButton
						loanId={viewerReservation.id}
						action="CANCEL"
						label="예약 취소"
						tone="secondary"
						confirmMessage="예약을 취소할까요?"
					/>
					<Link
						className="loan-panel-link subtle"
						href="/loans"
					>
						내 대여 현황 <ArrowRight size={17} />
					</Link>
				</div>
			</section>
		);

	if (isOwner)
		return (
			<section className="book-loan-panel owner-loan-panel">
				<span className="loan-panel-icon">
					<BookCheck size={22} />
				</span>
				<div className="owner-loan-content">
					<h2>{currentBorrowerName ? `${currentBorrowerName}님이 대여 중이에요` : '현재 대여자가 없어요'}</h2>
					<p>{queue.length ? `${queue.length}명이 순서대로 기다리고 있어요.` : '예약자가 생기면 이곳에 순서가 표시돼요.'}</p>
					{queue.length > 0 && (
						<ol className="reservation-queue">
							{queue.map((item) => (
								<li key={item.id}>
									<span>{item.queuePosition}</span>
									<strong>{item.borrowerName}</strong>
									<small>
										{new Intl.DateTimeFormat('ko-KR', {
											month: 'short',
											day: 'numeric',
										}).format(new Date(item.requestedAt))}{' '}
										예약
									</small>
								</li>
							))}
						</ol>
					)}
					{currentLoan?.status === 'RETURN_REQUESTED' && (
						<LoanActionButton
							loanId={currentLoan.id}
							action="COMPLETE_RETURN"
							label="반납 완료·다음 예약자 대여"
							confirmMessage="책을 돌려받았나요? 예약자가 있으면 첫 번째 동료에게 자동으로 넘어가요."
						/>
					)}
					{canManageBorrower && (
						<BorrowerManager
							bookId={bookId}
							currentBorrowerName={currentBorrowerName}
							queue={queue}
						/>
					)}
					{bookStatus !== 'UNAVAILABLE' && (
						<LoanActionButton
							bookId={bookId}
							label={loanLabel}
						/>
					)}
				</div>
			</section>
		);

	if (bookStatus === 'UNAVAILABLE')
		return (
			<section className="book-loan-panel muted">
				<span className="loan-panel-icon">
					<Clock3 size={22} />
				</span>
				<div>
					<h2>지금은 빌릴 수 없어요</h2>
					<p>책 상태가 대여 가능으로 바뀌면 다시 확인해 주세요.</p>
				</div>
			</section>
		);

	return (
		<section className="book-loan-panel">
			<span className="loan-panel-icon">
				<Handshake size={22} />
			</span>
			<div>
				<h2>{borrowed ? '다음 순서를 예약할까요?' : '이 책을 바로 빌려볼까요?'}</h2>
				<p>
					{borrowed
						? `현재 ${currentBorrowerName ?? '다른 동료'}님이 대여 중이에요. 예약은 신청 순서대로 연결돼요.`
						: '대여 가능 상태라 지금 바로 대여할 수 있어요.'}
				</p>
			</div>
			<LoanActionButton
				bookId={bookId}
				label={loanLabel}
			/>
		</section>
	);
}
