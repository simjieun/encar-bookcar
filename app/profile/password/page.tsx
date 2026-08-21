import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, KeyRound } from 'lucide-react';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';

export const metadata: Metadata = {
	title: '비밀번호 변경 | 엔카북카',
	description: '엔카북카 계정의 비밀번호를 바꿉니다.',
};

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
	const session = await getCurrentSession();
	if (!session) {
		redirect('/login?returnTo=/profile/password');
	}

	return (
		<main className="profile-page">
			<SiteHeader />

			<div className="profile-container">
				<div className="profile-grid">
					<section
						className="profile-card"
						aria-labelledby="password-heading"
					>
						<div className="profile-card-heading">
							<div>
								<p>SECURITY</p>
								<h2 id="password-heading">비밀번호 변경</h2>
							</div>
							<span className="verified-badge">
								<KeyRound size={15} /> 계정 보호
							</span>
						</div>
						<Link
							className="profile-back"
							href="/profile"
						>
							<ChevronLeft size={16} /> 내 정보로 돌아가기
						</Link>
						<ChangePasswordForm />
					</section>
				</div>
			</div>
		</main>
	);
}
