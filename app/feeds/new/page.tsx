import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { FeedForm } from '@/components/feeds/feed-form';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';
import { listReadBooks } from '@/lib/feed-data';

export const metadata: Metadata = {
	title: '피드 쓰기 | 엔카북카',
	description: '내가 빌린 책을 읽고 느낀 점을 기록하세요.',
};
export const dynamic = 'force-dynamic';

export default async function NewFeedPage() {
	const session = await getCurrentSession();
	if (!session) redirect('/login?returnTo=/feeds/new');
	const books = await listReadBooks(session.user.id);

	return (
		<main className="feed-form-page">
			<SiteHeader />
			<section className="book-form-hero compact">
				<Link
					className="form-back-link"
					href="/feeds"
				>
					<ChevronLeft size={16} /> 피드 목록으로
				</Link>
				<p>WRITE A FEED</p>
				<h1>읽은 책의 이야기를 남겨요</h1>
				<span>내가 빌린 책 중 하나를 골라 자유롭게 기록해 보세요.</span>
			</section>
			<FeedForm books={books} />
		</main>
	);
}
