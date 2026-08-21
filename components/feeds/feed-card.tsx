import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { BookCover } from '@/components/books/book-cover';
import type { FeedView } from '@/lib/types/feed';

const dateFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

/** 마크다운 기호만 걷어낸 미리보기. 정확한 렌더링은 상세에서 뷰어가 한다. */
export function toExcerpt(content: string, length = 140) {
	const plain = content
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[#>*_`~|-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

export function FeedCard({ feed }: { feed: FeedView }) {
	return (
		<article className="feed-card">
			<Link
				className="feed-card-cover"
				href={`/feeds/${feed.id}`}
			>
				<BookCover
					src={feed.coverImageUrl}
					title={feed.bookTitle}
					sizes="72px"
				/>
			</Link>
			<div className="feed-card-content">
				<div className="feed-card-top">
					<span className="feed-book-chip">
						{feed.bookTitle} · {feed.bookAuthor}
					</span>
					<small>{dateFormat.format(new Date(feed.createdAt))}</small>
				</div>
				<Link href={`/feeds/${feed.id}`}>
					<h3>{feed.title}</h3>
					<p>{toExcerpt(feed.content)}</p>
				</Link>
				<div className="feed-card-meta">
					<span>{feed.authorName}님</span>
					<span>
						<MessageCircle size={15} /> {feed.commentCount}
					</span>
				</div>
			</div>
		</article>
	);
}
