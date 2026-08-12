import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { PasswordResetButton } from '@/components/admin/password-reset-button';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';
import { listMembers } from '@/lib/member-data';

export const metadata: Metadata = {
	title: '회원 관리 | 엔카북카',
	description: '회원 비밀번호를 초기화합니다.',
};

export const dynamic = 'force-dynamic';

export default async function AdminMembersPage() {
	const session = await getCurrentSession();
	if (!session) {
		redirect('/login?returnTo=/admin/members');
	}

	// 관리자가 아니면 화면의 존재 자체를 숨긴다.
	if (session.user.role !== 'admin') {
		notFound();
	}

	const members = await listMembers();
	const formatDate = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

	return (
		<>
			<SiteHeader
				userName={session.user.name}
				isAdmin
			/>
			<main className="site-container admin-page">
				<div className="section-heading-row">
					<div>
						<p className="section-kicker">ADMIN</p>
						<h1>회원 관리</h1>
					</div>
					<span className="verified-badge">
						<ShieldCheck size={15} /> 관리자
					</span>
				</div>

				<p className="admin-guide">
					비밀번호를 잊은 동료의 계정을 초기화하면 임시 비밀번호가 한 번만 표시됩니다. 사내 메신저로 본인에게 직접 전달하고, 로그인 후 내 정보에서 바로 바꾸도록 안내해 주세요.
				</p>

				<ul className="member-list">
					{members.map((member) => (
						<li key={member.id}>
							<div className="member-info">
								<strong>{member.name}</strong>
								<span>{member.email}</span>
								<span className="member-joined">{formatDate.format(member.createdAt)} 가입</span>
							</div>
							<PasswordResetButton
								userId={member.id}
								userName={member.name}
							/>
						</li>
					))}
				</ul>
			</main>
		</>
	);
}
