import Link from 'next/link';
import { BookOpen, BookOpenCheck, BookSearch, Library, LogIn, NotebookPen, Plus, ShieldCheck, UserRound } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';
import { getCurrentSession } from '@/lib/auth-session';

// ponytail: 페이지마다 props를 넘기면 또 어긋나므로 헤더가 세션을 직접 읽는다.
export async function SiteHeader() {
	const user = (await getCurrentSession())?.user;

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
			<nav aria-label="주요 메뉴">
				{user ? (
					<>
						<Link href="/books">
							<Library size={16} /> 책장
						</Link>
						<Link href="/loans">
							<BookOpenCheck size={16} /> 내 대여
						</Link>
						<Link href="/feeds">
							<NotebookPen size={16} /> 피드
						</Link>
						<Link href="/wanted">
							<BookSearch size={16} /> <span className="nav-full">책 </span>찾아요
						</Link>
						<Link href="/books/new">
							<Plus size={16} /> <span className="nav-full">책 </span>등록
						</Link>
						<LogoutButton />
						{user.role === 'admin' && (
							<Link href="/admin/members">
								<ShieldCheck size={16} /> 회원<span className="nav-full"> 관리</span>
							</Link>
						)}
						<Link
							className="app-header-account"
							href="/profile"
						>
							<UserRound size={16} /> <span className="nav-name">{user.name}님</span>
						</Link>
					</>
				) : (
					<>
						<Link href="/books">
							<Library size={16} /> 책장
						</Link>
						<Link href="/feeds">
							<NotebookPen size={16} /> 피드
						</Link>
						<Link href="/wanted">
							<BookSearch size={16} /> <span className="nav-full">책 </span>찾아요
						</Link>
						<Link
							className="app-header-account"
							href="/login"
						>
							<LogIn size={16} /> 로그인
						</Link>
					</>
				)}
			</nav>
		</header>
	);
}
