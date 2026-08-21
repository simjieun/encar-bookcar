'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { LoaderCircle, NotebookPen } from 'lucide-react';
import Link from 'next/link';
import type { FeedView } from '@/lib/types/feed';
import { FeedCard } from './feed-card';

type FeedResponse = { feeds: FeedView[]; hasMore: boolean; page: number };

async function fetchFeeds(page: number) {
	const response = await fetch(`/api/feeds?page=${page}`);
	if (!response.ok) throw new Error('피드를 불러오지 못했어요.');
	return (await response.json()) as FeedResponse;
}

export function FeedList({ initialData }: { initialData: FeedResponse }) {
	const feedsQuery = useInfiniteQuery({
		queryKey: ['feeds'],
		queryFn: ({ pageParam }) => fetchFeeds(pageParam),
		initialPageParam: 1,
		initialData: { pages: [initialData], pageParams: [1] },
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
	});
	const feeds = feedsQuery.data?.pages.flatMap((page) => page.feeds) ?? [];

	if (feedsQuery.isError) {
		return (
			<div className="feed-empty">
				<strong>피드를 불러오지 못했어요</strong>
				<p>잠시 후 다시 시도해 주세요.</p>
				<button
					type="button"
					onClick={() => feedsQuery.refetch()}
				>
					다시 불러오기
				</button>
			</div>
		);
	}

	if (!feeds.length) {
		return (
			<div className="feed-empty">
				<NotebookPen size={26} />
				<strong>아직 올라온 피드가 없어요</strong>
				<p>빌린 책을 읽고 첫 번째 이야기를 남겨보세요.</p>
				<Link href="/feeds/new">피드 쓰기</Link>
			</div>
		);
	}

	return (
		<>
			<div className="feed-list">
				{feeds.map((feed) => (
					<FeedCard
						feed={feed}
						key={feed.id}
					/>
				))}
			</div>
			{feedsQuery.hasNextPage && (
				<button
					className="load-more-button"
					type="button"
					onClick={() => feedsQuery.fetchNextPage()}
					disabled={feedsQuery.isFetchingNextPage}
				>
					{feedsQuery.isFetchingNextPage ? (
						<LoaderCircle
							className="animate-spin"
							size={18}
						/>
					) : null}
					피드 더 보기
				</button>
			)}
		</>
	);
}
