'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { BookCover } from '@/components/books/book-cover';
import type { FeedBookOption } from '@/lib/types/feed';

// ponytail: 표지를 보여줘야 해서 네이티브 select를 못 쓴다. 라이브러리 대신 listbox 패턴을 직접 구현한다.
// 검색 필터는 넣지 않았다 — 목록이 "내가 빌린 책"이라 길어야 수십 권이고, 그때 가서 붙이면 된다.
export function BookSelect({
	books,
	value,
	onChange,
	error,
}: {
	books: FeedBookOption[];
	value: string;
	onChange: (bookId: string) => void;
	error?: string;
}) {
	const listId = useId();
	const errorId = `${listId}-error`;
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);
	const root = useRef<HTMLDivElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const list = useRef<HTMLDivElement>(null);
	const selected = books.find((book) => book.id === value) ?? null;

	useEffect(() => {
		if (!open) return;
		function closeOnOutside(event: PointerEvent) {
			if (!root.current?.contains(event.target as Node)) setOpen(false);
		}
		document.addEventListener('pointerdown', closeOnOutside);
		return () => document.removeEventListener('pointerdown', closeOnOutside);
	}, [open]);

	// 열릴 때 키 입력을 목록이 받도록 포커스를 옮긴다.
	useEffect(() => {
		if (open) list.current?.focus();
	}, [open]);

	useEffect(() => {
		if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
	}, [open, active, listId]);

	function openList() {
		setActive(
			Math.max(
				0,
				books.findIndex((book) => book.id === value),
			),
		);
		setOpen(true);
	}

	function choose(index: number) {
		onChange(books[index].id);
		setOpen(false);
		trigger.current?.focus();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			setOpen(false);
			trigger.current?.focus();
			return;
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!open) {
				openList();
				return;
			}
			setActive((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + books.length) % books.length);
			return;
		}
		if (open && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			choose(active);
		}
	}

	return (
		<div
			className="feed-book-select"
			ref={root}
			onKeyDown={handleKeyDown}
		>
			<button
				type="button"
				className={error ? 'feed-book-trigger is-invalid' : 'feed-book-trigger'}
				ref={trigger}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={open ? listId : undefined}
				aria-describedby={error ? errorId : undefined}
				onClick={() => (open ? setOpen(false) : openList())}
			>
				{selected ? (
					<>
						<BookCover
							src={selected.coverImageUrl}
							title={selected.title}
							sizes="44px"
						/>
						<span>
							<strong>{selected.title}</strong>
							<small>{selected.author}</small>
						</span>
					</>
				) : (
					<span className="feed-book-placeholder">내가 빌린 책 중에서 선택</span>
				)}
				<ChevronDown
					size={18}
					aria-hidden="true"
				/>
			</button>

			{open && (
				<div
					className="feed-book-listbox"
					role="listbox"
					id={listId}
					ref={list}
					tabIndex={-1}
					aria-label="내가 빌린 책"
					aria-activedescendant={`${listId}-${active}`}
				>
					{books.map((book, index) => (
						<div
							key={book.id}
							id={`${listId}-${index}`}
							role="option"
							aria-selected={book.id === value}
							className={index === active ? 'feed-book-option is-active' : 'feed-book-option'}
							onClick={() => choose(index)}
							onMouseMove={() => setActive(index)}
						>
							<BookCover
								src={book.coverImageUrl}
								title={book.title}
								sizes="44px"
							/>
							<span>
								<strong>{book.title}</strong>
								<small>{book.author}</small>
							</span>
							<Check
								size={17}
								aria-hidden="true"
							/>
						</div>
					))}
				</div>
			)}
			{error && (
				<small
					className="feed-book-error"
					id={errorId}
				>
					{error}
				</small>
			)}
		</div>
	);
}
