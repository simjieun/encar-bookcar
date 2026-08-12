import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpenCheck, Inbox } from 'lucide-react';
import { LoanCard } from '@/components/loans/loan-card';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';
import { countPendingLoanRequests, listLoansForUser } from '@/lib/loan-data';

export const metadata: Metadata = {
	title: '내 대여 현황 | 엔카북카',
	description: '내가 빌린 책과 빌려준 책의 진행 상태를 확인하세요.',
};
export const dynamic = 'force-dynamic';

export default async function LoansPage() {
	const session = await getCurrentSession();
	if (!session) redirect('/login?returnTo=/loans');
	const [{ borrowed, lent }, pendingCount] = await Promise.all([listLoansForUser(session.user.id), countPendingLoanRequests(session.user.id)]);

	return (
		<main className="loans-page">
			<SiteHeader userName={session.user.name} />
			<section className="loans-hero">
				<p>MY BOOK JOURNEY</p>
				<h1>
					책이 오가는 순간을
					<br />
					한눈에 확인해요
				</h1>
				<span>내 대여와 예약 순서, 내가 등록한 책의 흐름까지 한곳에 모았어요.</span>
			</section>
			<nav
				className="loan-tabs"
				aria-label="대여 현황 메뉴"
			>
				<Link
					className="active"
					href="/loans"
				>
					<BookOpenCheck size={18} />내 대여 현황
				</Link>
				<Link href="/loans/requests">
					<Inbox size={18} />
					예약 관리{pendingCount > 0 && <b>{pendingCount}</b>}
				</Link>
			</nav>
			<div className="loans-content">
				<LoanSection
					title="내가 빌린 책·예약"
					description="현재 대여와 내 예약 순서를 확인할 수 있어요."
					loans={borrowed}
					role="borrower"
					empty="아직 대여하거나 예약한 책이 없어요"
				/>
				<LoanSection
					title="내가 빌려준 책"
					description="내 책의 대여 진행 상태와 지난 이력을 확인할 수 있어요."
					loans={lent}
					role="owner"
					empty="아직 빌려준 책이 없어요"
				/>
			</div>
		</main>
	);
}

function LoanSection({
	title,
	description,
	loans,
	role,
	empty,
}: {
	title: string;
	description: string;
	loans: Awaited<ReturnType<typeof listLoansForUser>>['borrowed'];
	role: 'borrower' | 'owner';
	empty: string;
}) {
	return (
		<section className="loan-section">
			<div className="loan-section-heading">
				<div>
					<h2>{title}</h2>
					<p>{description}</p>
				</div>
				<span>{loans.length}</span>
			</div>
			{loans.length ? (
				<div className="loan-list">
					{loans.map((loan) => (
						<LoanCard
							key={loan.id}
							loan={loan}
							role={role}
						/>
					))}
				</div>
			) : (
				<div className="loan-empty">
					<BookOpenCheck size={25} />
					<strong>{empty}</strong>
					<p>책 둘러보기에서 다음 책을 만나보세요.</p>
					<Link href="/books">책 둘러보기</Link>
				</div>
			)}
		</section>
	);
}
