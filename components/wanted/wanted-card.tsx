import Link from 'next/link';
import { Hand } from 'lucide-react';
import { BookCover } from '@/components/books/book-cover';
import type { WantedBookView } from '@/lib/types/wanted';

const dateFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

export const WANTED_STATUS_LABELS = { OPEN: '찾는 중', FOUND: '해결됨' } as const;

export function WantedCard({ wanted }: { wanted: WantedBookView }) {
	return (
		<article className="feed-card">
			<Link
				className="feed-card-cover"
				href={`/wanted/${wanted.id}`}
			>
				<BookCover
					src={wanted.coverImageUrl}
					title={wanted.title}
					sizes="72px"
				/>
			</Link>
			<div className="feed-card-content">
				<div className="feed-card-top">
					<span className={`status status-${wanted.status === 'OPEN' ? 'available' : 'unavailable'}`}>{WANTED_STATUS_LABELS[wanted.status]}</span>
					<small>{dateFormat.format(new Date(wanted.createdAt))}</small>
				</div>
				<Link href={`/wanted/${wanted.id}`}>
					<h3>{wanted.title}</h3>
					<p>{wanted.message || wanted.author}</p>
				</Link>
				<div className="feed-card-meta">
					<span>{wanted.requesterName}님이 찾아요</span>
					<span>
						<Hand size={15} /> 있어요 {wanted.offerCount}명
					</span>
				</div>
			</div>
		</article>
	);
}
