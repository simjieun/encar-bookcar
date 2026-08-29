import Link from 'next/link';
import { BookCatalog } from '@/components/books/book-catalog';

export function BookDiscovery() {
	return (
		<section
			id="books"
			className="bg-surface pt-12 pb-24 md:pt-16 md:pb-32"
		>
			<div className="site-container">
				<div className="section-heading-row">
					<div>
						<span className="section-kicker">BOOK DISCOVERY</span>
						<h2>동료가 먼저 읽어본 책</h2>
						<p>새로운 관점을 건네줄 책을 가볍게 둘러보세요.</p>
					</div>
					<Link
						className="section-more-link"
						href="/books"
					>
						전체 책 보기
					</Link>
				</div>
				<BookCatalog compact />
			</div>
		</section>
	);
}
