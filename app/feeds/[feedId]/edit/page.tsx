import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { FeedForm } from '@/components/feeds/feed-form';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';
import { getFeed, listReadBooks } from '@/lib/feed-data';

export const metadata: Metadata = { title: '피드 수정 | 엔카북카' };
export const dynamic = 'force-dynamic';

export default async function EditFeedPage({ params }: { params: Promise<{ feedId: string }> }) {
	const { feedId } = await params;
	if (!z.uuid().safeParse(feedId).success) notFound();
	const session = await getCurrentSession();
	if (!session) redirect(`/login?returnTo=/feeds/${feedId}/edit`);
	const feed = await getFeed(feedId).catch(() => null);
	if (!feed) notFound();
	if (feed.authorId !== session.user.id) redirect(`/feeds/${feedId}`);
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
				<p>EDIT FEED</p>
				<h1>피드를 다듬어요</h1>
				<span>기록은 언제든 고칠 수 있어요.</span>
			</section>
			<FeedForm
				books={books}
				feedId={feedId}
				initialValue={{ bookId: feed.bookId, title: feed.title, content: feed.content }}
			/>
		</main>
	);
}
