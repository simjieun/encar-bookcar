import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpenCheck, Inbox } from 'lucide-react';
import { LoanCard } from '@/components/loans/loan-card';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';
import { listIncomingLoans } from '@/lib/loan-data';

export const metadata: Metadata = {
	title: '예약 관리 | 엔카북카',
	description: '내 책의 예약 순서를 확인하세요.',
};
export const dynamic = 'force-dynamic';

export default async function LoanRequestsPage() {
	const session = await getCurrentSession();
	if (!session) redirect('/login?returnTo=/loans/requests');
	const requests = await listIncomingLoans(session.user.id);

	return (
		<main className="loans-page">
			<SiteHeader />
			<section className="loans-hero compact">
				<p>RESERVATION QUEUE</p>
				<h1>
					예약 순서를
					<br />
					한눈에 확인해요
				</h1>
				<span>먼저 예약한 동료가 먼저 빌릴 수 있도록 순서대로 보여드려요.</span>
			</section>
			<nav
				className="loan-tabs"
				aria-label="대여 현황 메뉴"
			>
				<Link href="/loans">
					<BookOpenCheck size={18} />내 대여 현황
				</Link>
				<Link
					className="active"
					href="/loans/requests"
				>
					<Inbox size={18} />
					예약 관리{requests.length > 0 && <b>{requests.length}</b>}
				</Link>
			</nav>
			<div className="loans-content single">
				<section className="loan-section">
					<div className="loan-section-heading">
						<div>
							<h2>대기 중인 예약</h2>
							<p>책별 신청 시간 순서가 자동으로 유지돼요.</p>
						</div>
						<span>{requests.length}</span>
					</div>
					{requests.length ? (
						<div className="loan-list">
							{requests.map((loan) => (
								<LoanCard
									key={loan.id}
									loan={loan}
									role="owner"
								/>
							))}
						</div>
					) : (
						<div className="loan-empty">
							<Inbox size={25} />
							<strong>대기 중인 예약이 없어요</strong>
							<p>예약이 들어오면 순서와 함께 이곳에 표시돼요.</p>
							<Link href="/loans">대여 이력 보기</Link>
						</div>
					)}
				</section>
			</div>
		</main>
	);
}
