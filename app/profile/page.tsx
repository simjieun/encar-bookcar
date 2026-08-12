import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, BookOpenCheck, ChevronRight, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';
import { getCurrentSession } from '@/lib/auth-session';

export const metadata: Metadata = {
	title: '내 정보 | 엔카북카',
	description: '엔카북카 계정과 독서 활동을 확인하세요.',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
	const session = await getCurrentSession();
	if (!session) {
		redirect('/login?returnTo=/profile');
	}

	const initial = session.user.name.trim().charAt(0).toUpperCase() || '책';
	const joinedAt = new Intl.DateTimeFormat('ko-KR', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(session.user.createdAt);

	return (
		<main className="profile-page">
			<header className="profile-header">
				<Link
					className="auth-brand"
					href="/"
				>
					<span
						className="brand-mark"
						aria-hidden="true"
					>
						<BookOpen
							size={21}
							strokeWidth={2.6}
						/>
					</span>
					<span>엔카북카</span>
				</Link>
				<LogoutButton />
			</header>

			<div className="profile-container">
				<section className="profile-hero">
					<div
						className="profile-avatar"
						aria-hidden="true"
					>
						{initial}
					</div>
					<div>
						<p>반가워요</p>
						<h1>{session.user.name}님</h1>
						<span>오늘은 어떤 책을 만나볼까요?</span>
					</div>
				</section>

				<div className="profile-grid">
					<section
						className="profile-card"
						aria-labelledby="account-heading"
					>
						<div className="profile-card-heading">
							<div>
								<p>ACCOUNT</p>
								<h2 id="account-heading">내 정보</h2>
							</div>
							<span className="verified-badge">
								<ShieldCheck size={15} /> 가입 완료
							</span>
						</div>

						<dl className="profile-details">
							<div>
								<dt>
									<UserRound size={18} /> 이름
								</dt>
								<dd>{session.user.name}</dd>
							</div>
							<div>
								<dt>
									<Mail size={18} /> 이메일
								</dt>
								<dd>{session.user.email}</dd>
							</div>
						</dl>
						<p className="profile-joined">{joinedAt}부터 함께 읽고 있어요.</p>
					</section>

					<section
						className="profile-card profile-start"
						aria-labelledby="start-heading"
					>
						<div>
							<p>START HERE</p>
							<h2 id="start-heading">첫 번째 책을 만나보세요</h2>
							<span>동료들이 올린 책을 둘러보고 새로운 독서를 시작해요.</span>
						</div>
						<Link href="/#books">
							책 둘러보기 <ChevronRight size={18} />
						</Link>
						<Link href="/loans">
							<BookOpenCheck size={17} /> 내 대여 현황
						</Link>
					</section>
				</div>
			</div>
		</main>
	);
}
