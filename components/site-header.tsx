import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';

export function SiteHeader({ userName, isAdmin }: { userName?: string; isAdmin?: boolean }) {
	return (
		<header className="app-header">
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
			<nav aria-label="도서 메뉴">
				<Link href="/books">책 둘러보기</Link>
				{userName && (
					<Link
						className="app-header-loans"
						href="/loans"
					>
						내 대여
					</Link>
				)}
				{isAdmin && <Link href="/admin/members">회원 관리</Link>}
				<Link
					className="app-header-add"
					href="/books/new"
				>
					<Plus size={17} /> 책 등록
				</Link>
				<Link
					className="app-header-account"
					href={userName ? '/profile' : '/login'}
				>
					{userName ? `${userName}님` : '로그인'}
				</Link>
			</nav>
		</header>
	);
}
