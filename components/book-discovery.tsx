import Link from 'next/link';
import { BookCatalog } from '@/components/books/book-catalog';

const SHELVES = [
	{ ownership: 'CLUB', kicker: 'BOOK CLUB', title: '북클럽 책장', description: '북클럽이 함께 마련한 책을 둘러보세요.' },
	{ ownership: 'PERSONAL', kicker: 'COLLEAGUE LIBRARY', title: '동료의 서재', description: '동료가 아껴 읽은 책을 빌려 볼 수 있어요.' },
] as const;

export function BookDiscovery() {
	return (
		<section
			id="books"
			className="bg-surface pt-12 pb-24 md:pt-16 md:pb-32"
		>
			<div className="site-container space-y-20">
				{SHELVES.map((shelf) => (
					<div key={shelf.ownership}>
						<div className="section-heading-row">
							<div>
								<span className="section-kicker">{shelf.kicker}</span>
								<h2>{shelf.title}</h2>
								<p>{shelf.description}</p>
							</div>
							<Link
								className="section-more-link"
								href={`/books?ownership=${shelf.ownership}`}
							>
								{shelf.title} 전체 보기
							</Link>
						</div>
						<BookCatalog
							compact
							ownership={shelf.ownership}
						/>
					</div>
				))}
			</div>
		</section>
	);
}
