import { Heart } from 'lucide-react';
import Link from 'next/link';
import { BOOK_STATUS_LABELS } from '@/lib/schemas/book';
import type { BookView } from '@/lib/types/book';
import { BookCover } from './book-cover';

export function BookCard({ book }: { book: BookView }) {
	const personal = book.ownership === 'PERSONAL';
	return (
		<Link
			className={`book-card book-card-real${personal ? ' book-card-personal' : ''}`}
			href={`/books/${book.id}`}
		>
			{personal && <span className="book-ribbon">개인 소장</span>}
			<BookCover
				src={book.coverImageUrl}
				title={book.title}
			/>
			<div className="mt-5 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<h3>{book.title}</h3>
						<p>{book.author}</p>
					</div>
					<span className={`status status-${book.status.toLowerCase()}`}>{BOOK_STATUS_LABELS[book.status]}</span>
				</div>
				{personal ? (
					<p className="owner owner-personal">
						<Heart
							size={13}
							aria-hidden="true"
						/>
						{book.ownerName} 님이 빌려줘요
					</p>
				) : (
					<p className="owner">북클럽 책 · {book.ownerName} 님 등록</p>
				)}
			</div>
		</Link>
	);
}
