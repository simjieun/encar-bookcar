import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, ExternalLink, MapPin, Pencil, UserRound } from 'lucide-react';
import { z } from 'zod';
import { BookCover } from '@/components/books/book-cover';
import { DeleteBookButton } from '@/components/books/delete-book-button';
import { BookLoanPanel } from '@/components/loans/book-loan-panel';
import { SiteHeader } from '@/components/site-header';
import { getCurrentSession } from '@/lib/auth-session';
import { getBook } from '@/lib/book-data';
import { getBookLoanContext } from '@/lib/loan-data';
import { BOOK_STATUS_LABELS, bookStatusSchema } from '@/lib/schemas/book';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '책 상세 | 엔카북카' };

export default async function BookDetailPage({ params }: { params: Promise<{ bookId: string }> }) {
	const { bookId } = await params;
	if (!z.uuid().safeParse(bookId).success) notFound();
	const [book, session] = await Promise.all([getBook(bookId).catch(() => null), getCurrentSession()]);
	if (!book) notFound();
	const loanContext = await getBookLoanContext(bookId, session?.user.id);
	const parsedStatus = bookStatusSchema.safeParse(book.status);
	if (!parsedStatus.success) notFound();
	const isOwner = session?.user.id === book.ownerId;
	const published = book.publishedAt?.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3');

	return (
		<main className="book-detail-page">
			<SiteHeader />
			<article className="book-detail-container">
				<div className="book-detail-cover">
					<BookCover
						src={book.coverImageUrl}
						title={book.title}
						sizes="(max-width: 760px) 70vw, 310px"
						priority
					/>
				</div>
				<div className="book-detail-content">
					<span className={`detail-status status-${book.status.toLowerCase()}`}>{BOOK_STATUS_LABELS[parsedStatus.data]}</span>
					<h1>{book.title}</h1>
					<p className="book-detail-author">{book.author}</p>
					<dl className="book-meta">
						<div>
							<dt>
								<UserRound size={18} />
								등록자
							</dt>
							<dd>{book.ownerName}</dd>
						</div>
						{book.currentBorrowerName && (
							<div>
								<dt>
									<UserRound size={18} />
									현재 대여자
								</dt>
								<dd>{book.currentBorrowerName}</dd>
							</div>
						)}
						{book.publisher && (
							<div>
								<dt>출판사</dt>
								<dd>{book.publisher}</dd>
							</div>
						)}
						{published && (
							<div>
								<dt>
									<CalendarDays size={18} />
									출간일
								</dt>
								<dd>{published}</dd>
							</div>
						)}
						{book.location && (
							<div>
								<dt>
									<MapPin size={18} />
									보관·전달
								</dt>
								<dd>{book.location}</dd>
							</div>
						)}
					</dl>
					{book.description && (
						<section className="book-description">
							<h2>이 책에 대해</h2>
							<p>{book.description}</p>
						</section>
					)}
					<BookLoanPanel
						bookId={book.id}
						bookStatus={parsedStatus.data}
						ownerId={book.ownerId}
						currentBorrowerId={book.currentBorrowerId}
						currentBorrowerName={book.currentBorrowerName}
						viewer={session ? { id: session.user.id, name: session.user.name } : null}
						currentLoan={loanContext.currentLoan}
						queue={loanContext.queue}
						viewerReservation={loanContext.viewerReservation}
					/>
					<div className="book-detail-actions">
						{book.sourceLink && (
							<a
								href={book.sourceLink}
								target="_blank"
								rel="noreferrer"
							>
								카카오 도서 정보 <ExternalLink size={16} />
							</a>
						)}
						{isOwner && (
							<>
								<Link href={`/books/${book.id}/edit`}>
									<Pencil size={16} />
									수정
								</Link>
								<DeleteBookButton bookId={book.id} />
							</>
						)}
					</div>
				</div>
			</article>
		</main>
	);
}
