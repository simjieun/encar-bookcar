import type { Metadata } from 'next';
import Link from 'next/link';
import { BookCatalog } from '@/components/books/book-catalog';
import { SiteHeader } from '@/components/site-header';
import { bookListQuerySchema } from '@/lib/schemas/book';

export const metadata: Metadata = {
	title: '책장 | 엔카북카',
	description: '북클럽 책과 동료가 빌려주는 개인 소장 책을 함께 둘러보세요.',
};
export const dynamic = 'force-dynamic';

const TABS = [
	{ value: 'ALL', label: '전체' },
	{ value: 'CLUB', label: '북클럽 책장' },
	{ value: 'PERSONAL', label: '동료의 서재' },
] as const;

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ ownership?: string }> }) {
	const ownership = bookListQuerySchema.shape.ownership.catch('ALL').parse((await searchParams).ownership);

	return (
		<main className="books-page">
			<SiteHeader />
			<section className="books-page-hero">
				<p>OUR LIBRARY</p>
				<h1>
					북클럽 책장과 동료의 서재에서
					<br />
					다음 책을 발견해요
				</h1>
				<span>북클럽이 함께 산 책도, 동료가 아껴 읽은 책도 빌려 볼 수 있어요.</span>
			</section>
			<section className="books-catalog-section">
				<nav
					className="loan-tabs books-tabs"
					aria-label="책 구분"
				>
					{TABS.map((tab) => (
						<Link
							key={tab.value}
							href={tab.value === 'ALL' ? '/books' : `/books?ownership=${tab.value}`}
							className={ownership === tab.value ? 'active' : undefined}
							aria-current={ownership === tab.value ? 'page' : undefined}
						>
							{tab.label}
						</Link>
					))}
				</nav>
				<BookCatalog ownership={ownership} />
			</section>
		</main>
	);
}
