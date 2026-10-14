import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, ChevronLeft, ExternalLink, Hand, Library, UserRound } from 'lucide-react';
import { z } from 'zod';
import { BookCover } from '@/components/books/book-cover';
import { SiteHeader } from '@/components/site-header';
import { WantedActions } from '@/components/wanted/wanted-actions';
import { WANTED_STATUS_LABELS } from '@/components/wanted/wanted-card';
import { WantedOfferButton } from '@/components/wanted/wanted-offer-button';
import { getCurrentSession } from '@/lib/auth-session';
import { BOOK_STATUS_LABELS } from '@/lib/schemas/book';
import { findLibraryMatches, getWantedBook, listWantedOffers } from '@/lib/wanted-data';

export const metadata: Metadata = { title: '책 찾아요 | 엔카북카' };
export const dynamic = 'force-dynamic';

const dateFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

export default async function WantedDetailPage({ params }: { params: Promise<{ wantedId: string }> }) {
	const { wantedId } = await params;
	if (!z.uuid().safeParse(wantedId).success) notFound();
	const [wanted, session] = await Promise.all([getWantedBook(wantedId).catch(() => null), getCurrentSession()]);
	if (!wanted) notFound();
	const [offers, libraryMatches] = await Promise.all([listWantedOffers(wantedId), findLibraryMatches(wanted.isbn)]);

	const viewerId = session?.user.id;
	const isRequester = viewerId === wanted.requesterId;
	const isAdmin = session?.user.role === 'admin';
	const offered = offers.some((offer) => offer.userId === viewerId);

	return (
		<main className="book-detail-page">
			<SiteHeader />
			<div className="wanted-detail-nav">
				<Link
					className="form-back-link"
					href="/wanted"
				>
					<ChevronLeft size={16} /> 책 찾아요 목록으로
				</Link>
			</div>
			<article className="book-detail-container">
				<div className="book-detail-cover">
					<BookCover
						src={wanted.coverImageUrl}
						title={wanted.title}
						sizes="(max-width: 760px) 70vw, 310px"
						priority
					/>
				</div>
				<div className="book-detail-content">
					<span className={`detail-status status-${wanted.status === 'OPEN' ? 'available' : 'unavailable'}`}>{WANTED_STATUS_LABELS[wanted.status]}</span>
					<h1>{wanted.title}</h1>
					<p className="book-detail-author">{wanted.author}</p>
					<dl className="book-meta">
						<div>
							<dt>
								<UserRound size={18} />
								찾는 사람
							</dt>
							<dd>
								{wanted.requesterName} · {dateFormat.format(new Date(wanted.createdAt))}
							</dd>
						</div>
						{wanted.publisher && (
							<div>
								<dt>출판사</dt>
								<dd>{wanted.publisher}</dd>
							</div>
						)}
					</dl>
					{wanted.message && (
						<section className="book-description">
							<h2>읽고 싶은 이유</h2>
							<p>{wanted.message}</p>
						</section>
					)}

					{libraryMatches.map((book) => (
						<Link
							key={book.id}
							className="wanted-library-match"
							href={`/books/${book.id}`}
						>
							<Library size={18} />
							<span>
								<strong>엔카북카 서가에 있어요</strong>
								<small>
									{book.title} · {BOOK_STATUS_LABELS[book.status]}
								</small>
							</span>
							<ArrowUpRight size={16} />
						</Link>
					))}

					<section className="wanted-offers">
						<h2>
							<Hand size={18} /> 있어요 {offers.length}명
						</h2>
						{offers.length ? (
							<ul>
								{offers.map((offer) => (
									<li key={offer.userId}>
										<strong>{offer.userName}</strong>
										<small>{dateFormat.format(new Date(offer.createdAt))}</small>
									</li>
								))}
							</ul>
						) : (
							<p>아직 응답한 동료가 없어요.</p>
						)}
						{session && !isRequester && (wanted.status === 'OPEN' || offered) && (
							<WantedOfferButton
								wantedId={wanted.id}
								offered={offered}
							/>
						)}
						{!session && wanted.status === 'OPEN' && <Link href={`/login?returnTo=/wanted/${wanted.id}`}>로그인하고 &ldquo;나 있어요&rdquo; 남기기</Link>}
					</section>

					<div className="book-detail-actions">
						{wanted.sourceLink && (
							<a
								href={wanted.sourceLink}
								target="_blank"
								rel="noreferrer"
							>
								카카오 도서 정보 <ExternalLink size={16} />
							</a>
						)}
						{(isRequester || isAdmin) && (
							<WantedActions
								wantedId={wanted.id}
								status={wanted.status}
								canChangeStatus={isRequester}
							/>
						)}
					</div>
				</div>
			</article>
		</main>
	);
}
