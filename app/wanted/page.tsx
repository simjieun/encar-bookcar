import type { Metadata } from 'next';
import Link from 'next/link';
import { BookSearch } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { WantedList } from '@/components/wanted/wanted-list';
import { wantedListQuerySchema, type WantedListFilter } from '@/lib/schemas/wanted';
import { listWantedBooks } from '@/lib/wanted-data';

export const metadata: Metadata = {
	title: '책 찾아요 | 엔카북카',
	description: '읽고 싶은 책을 가진 동료를 찾아보세요.',
};
export const dynamic = 'force-dynamic';

const TABS: { status: WantedListFilter; label: string }[] = [
	{ status: 'OPEN', label: '찾는 중' },
	{ status: 'FOUND', label: '해결됨' },
	{ status: 'ALL', label: '전체' },
];

export default async function WantedPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
	const { status } = wantedListQuerySchema.catch({ status: 'OPEN', page: 1 }).parse(await searchParams);
	const initialData = await listWantedBooks({ status });

	return (
		<main className="feeds-page">
			<SiteHeader />
			<section className="feeds-hero">
				<p>BOOK WANTED</p>
				<h1>
					읽고 싶은 책,
					<br />
					누가 갖고 있을까요?
				</h1>
				<span>찾는 책을 올리면 그 책을 가진 동료가 &ldquo;나 있어요&rdquo;로 알려줘요.</span>
				<Link href="/wanted/new">
					<BookSearch size={18} /> 책 찾기
				</Link>
			</section>
			<nav
				className="loan-tabs"
				aria-label="요청 상태"
			>
				{TABS.map((tab) => (
					<Link
						key={tab.status}
						className={tab.status === status ? 'active' : undefined}
						href={tab.status === 'OPEN' ? '/wanted' : `/wanted?status=${tab.status}`}
					>
						{tab.label}
					</Link>
				))}
			</nav>
			<section className="feeds-section wanted-section">
				<WantedList
					key={status}
					status={status}
					initialData={initialData}
				/>
			</section>
		</main>
	);
}
