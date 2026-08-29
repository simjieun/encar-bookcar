'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { LoaderCircle, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import type { BookView } from '@/lib/types/book';
import { BookCard } from './book-card';

type BookResponse = { books: BookView[]; hasMore: boolean; page: number };

async function fetchBooks({ query, status, sort, page }: { query: string; status: string; sort: string; page: number }) {
	const params = new URLSearchParams({
		query,
		status,
		sort,
		page: String(page),
	});
	const response = await fetch(`/api/books?${params}`);
	if (!response.ok) throw new Error('책 목록을 불러오지 못했어요.');
	return (await response.json()) as BookResponse;
}

export function BookCatalog({ compact = false }: { compact?: boolean }) {
	const [input, setInput] = useState('');
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState('ALL');
	const [sort, setSort] = useState('latest');
	const booksQuery = useInfiniteQuery({
		queryKey: ['books', query, status, sort],
		queryFn: ({ pageParam }) => fetchBooks({ query, status, sort, page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
	});

	const books = booksQuery.data?.pages.flatMap((page) => page.books) ?? [];
	const visibleBooks = compact ? books.slice(0, 4) : books;

	function search(event: FormEvent) {
		event.preventDefault();
		setQuery(input.trim());
	}

	return (
		<>
			<div className="catalog-controls">
				<form
					className="book-search"
					onSubmit={search}
				>
					<Search
						size={20}
						aria-hidden="true"
					/>
					<label
						className="sr-only"
						htmlFor={compact ? 'home-book-search' : 'book-search'}
					>
						책 제목 또는 저자 검색
					</label>
					<input
						id={compact ? 'home-book-search' : 'book-search'}
						type="search"
						value={input}
						onChange={(event) => setInput(event.target.value)}
						placeholder="책 제목이나 저자를 검색해 보세요"
					/>
					{input && (
						<button
							type="button"
							onClick={() => {
								setInput('');
								setQuery('');
							}}
							aria-label="검색어 지우기"
						>
							<X size={17} />
						</button>
					)}
				</form>
				{!compact && (
					<div className="catalog-filters">
						<select
							value={status}
							onChange={(event) => setStatus(event.target.value)}
							aria-label="대여 상태"
						>
							<option value="ALL">전체 상태</option>
							<option value="AVAILABLE">대여 가능</option>
							<option value="BORROWED">대여 중</option>
							<option value="UNAVAILABLE">대여 불가</option>
						</select>
						<select
							value={sort}
							onChange={(event) => setSort(event.target.value)}
							aria-label="정렬"
						>
							<option value="latest">최근 등록순</option>
							<option value="oldest">오래된 순</option>
						</select>
						<Link
							className="primary-button"
							href="/books/new"
						>
							<Plus
								size={17}
								aria-hidden="true"
							/>
							책 등록하기
						</Link>
					</div>
				)}
			</div>

			{booksQuery.isPending ? (
				<div
					className="book-grid"
					aria-label="책을 불러오는 중"
				>
					{Array.from({ length: 4 }).map((_, index) => (
						<div
							className="book-card-skeleton"
							key={index}
						/>
					))}
				</div>
			) : booksQuery.isError ? (
				<div className="empty-books">
					<strong>책을 불러오지 못했어요</strong>
					<p>잠시 후 다시 시도해 주세요.</p>
					<button onClick={() => booksQuery.refetch()}>다시 불러오기</button>
				</div>
			) : visibleBooks.length ? (
				<>
					<div className="book-grid">
						{visibleBooks.map((book) => (
							<BookCard
								book={book}
								key={book.id}
							/>
						))}
					</div>
					{!compact && booksQuery.hasNextPage && (
						<button
							className="load-more-button"
							type="button"
							onClick={() => booksQuery.fetchNextPage()}
							disabled={booksQuery.isFetchingNextPage}
						>
							{booksQuery.isFetchingNextPage ? (
								<LoaderCircle
									className="animate-spin"
									size={18}
								/>
							) : null}
							더 많은 책 보기
						</button>
					)}
				</>
			) : (
				<div className="empty-books">
					<Search size={28} />
					<strong>{query ? '찾는 책이 아직 없어요' : '첫 번째 책을 기다리고 있어요'}</strong>
					<p>{query ? '다른 제목이나 저자로 검색해 보세요.' : '동료에게 추천하고 싶은 책을 등록해 보세요.'}</p>
					<Link href="/books/new">책 등록하기</Link>
				</div>
			)}
		</>
	);
}
