import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, ChevronLeft, Pencil } from 'lucide-react';
import { z } from 'zod';
import { BookCover } from '@/components/books/book-cover';
import { DeleteFeedButton } from '@/components/feeds/delete-feed-button';
import { FeedComments } from '@/components/feeds/feed-comments';
import { MarkdownViewer } from '@/components/feeds/markdown-viewer';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';
import { getFeed, listFeedComments } from '@/lib/feed-data';

export const metadata: Metadata = { title: '피드 | 엔카북카' };
export const dynamic = 'force-dynamic';

const dateFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

export default async function FeedDetailPage({ params }: { params: Promise<{ feedId: string }> }) {
	const { feedId } = await params;
	if (!z.uuid().safeParse(feedId).success) notFound();
	const [feed, session] = await Promise.all([getFeed(feedId).catch(() => null), getCurrentSession()]);
	if (!feed) notFound();
	const comments = await listFeedComments(feedId);
	const isAuthor = session?.user.id === feed.authorId;

	return (
		<main className="feed-detail-page">
			<SiteHeader />
			<div className="feed-detail-nav">
				<Link
					className="form-back-link"
					href="/feeds"
				>
					<ChevronLeft size={16} /> 피드 목록으로
				</Link>
			</div>
			<article className="feed-detail">
				<Link
					className="feed-detail-book"
					href={`/books/${feed.bookId}`}
				>
					<BookCover
						src={feed.coverImageUrl}
						title={feed.bookTitle}
						sizes="64px"
					/>
					<span>
						<strong>{feed.bookTitle}</strong>
						<small>{feed.bookAuthor}</small>
					</span>
					<ArrowUpRight size={16} />
				</Link>
				<h1>{feed.title}</h1>
				<p className="feed-detail-meta">
					{feed.authorName}님 · {dateFormat.format(new Date(feed.createdAt))}
				</p>
				<MarkdownViewer content={feed.content} />
				{isAuthor && (
					<div className="book-detail-actions">
						<Link href={`/feeds/${feed.id}/edit`}>
							<Pencil size={16} />
							수정
						</Link>
						<DeleteFeedButton feedId={feed.id} />
					</div>
				)}
				<FeedComments
					feedId={feed.id}
					comments={comments}
					viewerId={session?.user.id ?? null}
				/>
			</article>
		</main>
	);
}
