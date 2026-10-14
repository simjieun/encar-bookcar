import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { BookOwnershipTransfer } from '@/components/admin/book-ownership-transfer';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';
import { listBooks } from '@/lib/book-data';
import { listMembers } from '@/lib/member-data';
import { bookOwnershipSchema } from '@/lib/schemas/book';

export const metadata: Metadata = {
	title: '책 이관 | 엔카북카',
	description: '등록된 책을 동료의 서재(개인 소장)로 이관합니다.',
};

export const dynamic = 'force-dynamic';

export default async function AdminBooksPage() {
	const session = await getCurrentSession();
	if (!session) {
		redirect('/login?returnTo=/admin/books');
	}

	// 관리자가 아니면 화면의 존재 자체를 숨긴다.
	if (session.user.role !== 'admin') {
		notFound();
	}

	// ponytail: 사내 북클럽 규모라 한 번에 전부 불러온다. 수천 권이 되면 검색·페이지네이션 추가
	const [{ books }, members] = await Promise.all([listBooks({ limit: 1000 }), listMembers()]);

	return (
		<>
			<SiteHeader />
			<main className="site-container admin-page">
				<div className="section-heading-row">
					<div>
						<p className="section-kicker">ADMIN</p>
						<h1>책 이관</h1>
					</div>
					<span className="verified-badge">
						<ShieldCheck size={15} /> 관리자
					</span>
				</div>

				<nav
					className="loan-tabs admin-tabs"
					aria-label="관리자 메뉴"
				>
					<Link href="/admin/members">회원 관리</Link>
					<Link
						className="active"
						href="/admin/books"
						aria-current="page"
					>
						책 이관
					</Link>
				</nav>

				<p className="admin-guide">
					동료가 개인적으로 소장한 책을 골라 소장자를 지정하면 「동료의 서재」로 옮겨집니다. 이후 대여 승인과 책 정보 수정은 소장자가 맡게 돼요.
				</p>

				<BookOwnershipTransfer
					books={books.map((book) => ({
						id: book.id,
						title: book.title,
						author: book.author,
						ownership: bookOwnershipSchema.catch('CLUB').parse(book.ownership),
						ownerName: book.ownerName,
					}))}
					members={members.map((member) => ({ id: member.id, name: member.name, email: member.email }))}
				/>
			</main>
		</>
	);
}
