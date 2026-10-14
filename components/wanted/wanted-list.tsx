'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { BookSearch, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import type { WantedListFilter } from '@/lib/schemas/wanted';
import type { WantedBookView } from '@/lib/types/wanted';
import { WantedCard } from './wanted-card';

type WantedResponse = { wantedBooks: WantedBookView[]; hasMore: boolean; page: number };

async function fetchWantedBooks(status: WantedListFilter, page: number) {
	const response = await fetch(`/api/wanted?status=${status}&page=${page}`);
	if (!response.ok) throw new Error('요청 목록을 불러오지 못했어요.');
	return (await response.json()) as WantedResponse;
}

export function WantedList({ status, initialData }: { status: WantedListFilter; initialData: WantedResponse }) {
	const wantedQuery = useInfiniteQuery({
		queryKey: ['wanted', status],
		queryFn: ({ pageParam }) => fetchWantedBooks(status, pageParam),
		initialPageParam: 1,
		initialData: { pages: [initialData], pageParams: [1] },
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
	});
	const wantedBooks = wantedQuery.data?.pages.flatMap((page) => page.wantedBooks) ?? [];

	if (wantedQuery.isError) {
		return (
			<div className="feed-empty">
				<strong>요청 목록을 불러오지 못했어요</strong>
				<p>잠시 후 다시 시도해 주세요.</p>
				<button
					type="button"
					onClick={() => wantedQuery.refetch()}
				>
					다시 불러오기
				</button>
			</div>
		);
	}

	if (!wantedBooks.length) {
		return (
			<div className="feed-empty">
				<BookSearch size={26} />
				<strong>{status === 'FOUND' ? '아직 해결된 요청이 없어요' : '지금 찾고 있는 책이 없어요'}</strong>
				<p>읽고 싶은 책이 있다면 동료에게 물어보세요.</p>
				<Link href="/wanted/new">책 찾기</Link>
			</div>
		);
	}

	return (
		<>
			<div className="feed-list">
				{wantedBooks.map((wanted) => (
					<WantedCard
						wanted={wanted}
						key={wanted.id}
					/>
				))}
			</div>
			{wantedQuery.hasNextPage && (
				<button
					className="load-more-button"
					type="button"
					onClick={() => wantedQuery.fetchNextPage()}
					disabled={wantedQuery.isFetchingNextPage}
				>
					{wantedQuery.isFetchingNextPage ? (
						<LoaderCircle
							className="animate-spin"
							size={18}
						/>
					) : null}
					더 보기
				</button>
			)}
		</>
	);
}
