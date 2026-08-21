import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpenCheck, ChevronRight, KeyRound, Mail, NotebookPen, PenLine, Plus, ShieldCheck, UserRound } from 'lucide-react';
import { FeedCard } from '@/components/feeds/feed-card';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';
import { listFeeds } from '@/lib/feed-data';

const MY_FEED_PREVIEW = 5;

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

	// ponytail: 최근 몇 개만 미리 보여준다. 더 필요해지면 /feeds에 작성자 필터를 붙인다.
	const myFeeds = await listFeeds({ authorId: session.user.id, limit: MY_FEED_PREVIEW });
	const initial = session.user.name.trim().charAt(0).toUpperCase() || '책';
	const joinedAt = new Intl.DateTimeFormat('ko-KR', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(session.user.createdAt);

	return (
		<main className="profile-page">
			<SiteHeader />

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
								<dd className="profile-name-row">
									{session.user.name}
									<Link
										className="profile-password-link"
										href="/profile/password"
									>
										<KeyRound size={14} /> 비밀번호 변경
									</Link>
								</dd>
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
						<Link href="/books/new">
							<Plus size={17} /> 책 등록하기
						</Link>
					</section>
				</div>

				<section
					className="profile-card profile-feeds"
					aria-labelledby="my-feeds-heading"
				>
					<div className="profile-card-heading">
						<div>
							<p>MY FEED</p>
							<h2 id="my-feeds-heading">내가 쓴 피드</h2>
						</div>
						<Link
							className="profile-password-link"
							href="/feeds/new"
						>
							<PenLine size={14} /> 피드 쓰기
						</Link>
					</div>

					{myFeeds.feeds.length ? (
						<>
							<div className="feed-list">
								{myFeeds.feeds.map((feed) => (
									<FeedCard
										feed={feed}
										key={feed.id}
									/>
								))}
							</div>
							{myFeeds.hasMore && (
								<p className="profile-joined">
									최근 {MY_FEED_PREVIEW}개만 보여주고 있어요. <Link href="/feeds">전체 피드 보기</Link>
								</p>
							)}
						</>
					) : (
						<div className="feed-empty">
							<NotebookPen size={26} />
							<strong>아직 쓴 피드가 없어요</strong>
							<p>빌린 책을 읽고 첫 이야기를 남겨보세요.</p>
							<Link href="/feeds/new">피드 쓰기</Link>
						</div>
					)}
				</section>
			</div>
		</main>
	);
}
