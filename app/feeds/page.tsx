import type { Metadata } from 'next';
import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { FeedList } from '@/components/feeds/feed-list';
import { SiteHeader } from '@/components/site-header';
import { listFeeds } from '@/lib/feed-data';

export const metadata: Metadata = {
	title: '피드 | 엔카북카',
	description: '동료가 빌린 책을 읽고 남긴 이야기를 만나보세요.',
};
export const dynamic = 'force-dynamic';

export default async function FeedsPage() {
	const initialData = await listFeeds();

	return (
		<main className="feeds-page">
			<SiteHeader />
			<section className="feeds-hero">
				<p>READING FEED</p>
				<h1>
					같은 책을 읽은 동료의
					<br />
					이야기를 만나요
				</h1>
				<span>빌린 책을 읽고 남긴 기록이 이곳에 모여요.</span>
				<Link href="/feeds/new">
					<PenLine size={18} /> 피드 쓰기
				</Link>
			</section>
			<section className="feeds-section">
				<FeedList initialData={initialData} />
			</section>
		</main>
	);
}
