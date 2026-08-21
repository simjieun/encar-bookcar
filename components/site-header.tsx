import Link from 'next/link';
import { BookOpen, BookOpenCheck, ChevronDown, Compass, NotebookPen, Plus, ShieldCheck } from 'lucide-react';
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
					<div className="app-header-menu">
						<Link
							className="app-header-account"
							href="/profile"
						>
							{user.name}님
							<ChevronDown
								size={15}
								aria-hidden="true"
							/>
						</Link>
						{/* ponytail: 호버·포커스만으로 여는 CSS 드롭다운. 클릭 토글이 필요해지면 클라이언트 컴포넌트로 뺀다. */}
						<div className="app-header-dropdown">
							<Link href="/books">
								<Compass size={16} /> 책 둘러보기
							</Link>
							<Link href="/loans">
								<BookOpenCheck size={16} /> 내 대여
							</Link>
							<Link href="/feeds">
								<NotebookPen size={16} /> 피드
							</Link>
							<Link href="/books/new">
								<Plus size={16} /> 책 등록
							</Link>
							{user.role === 'admin' && (
								<Link href="/admin/members">
									<ShieldCheck size={16} /> 회원 관리
								</Link>
							)}
							<LogoutButton />
						</div>
					</div>
				) : (
					<>
						<Link href="/books">책 둘러보기</Link>
						<Link href="/feeds">피드</Link>
						<Link
							className="app-header-account"
							href="/login"
						>
							로그인
						</Link>
					</>
				)}
			</nav>
		</header>
	);
}
