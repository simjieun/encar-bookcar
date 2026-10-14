'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, LoaderCircle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BookCover } from '@/components/books/book-cover';
import { KakaoBookSearch } from '@/components/books/kakao-book-search';
import { wantedBookSchema, type WantedBookInput } from '@/lib/schemas/wanted';
import type { KakaoBook } from '@/lib/types/book';

async function saveWantedBook(input: WantedBookInput) {
	const response = await fetch('/api/wanted', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	});
	const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
	if (!response.ok || !payload.id) throw new Error(payload.message ?? '요청을 올리지 못했어요.');
	return payload.id;
}

// ponytail: 사람이 입력하는 칸이 한마디 하나뿐이라 react-hook-form 없이 상태 두 개로 처리한다.
export function WantedForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [book, setBook] = useState<KakaoBook | null>(null);
	const [message, setMessage] = useState('');
	const [error, setError] = useState<string | null>(null);
	const mutation = useMutation({
		mutationFn: saveWantedBook,
		onSuccess: async (id) => {
			await queryClient.invalidateQueries({ queryKey: ['wanted'] });
			router.push(`/wanted/${id}`);
			router.refresh();
		},
		onError: (mutationError) => setError(mutationError.message),
	});

	function selectBook(selected: KakaoBook) {
		setBook(selected);
		setError(null);
		window.setTimeout(() => document.getElementById('wanted-details')?.scrollIntoView({ behavior: 'smooth' }), 50);
	}

	function submit(event: FormEvent) {
		event.preventDefault();
		const parsed = wantedBookSchema.safeParse({ ...book, message });
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? '입력 내용을 확인해 주세요.');
			return;
		}
		mutation.mutate(parsed.data);
	}

	return (
		<div className="book-form-flow">
			<KakaoBookSearch
				onSelect={selectBook}
				heading="어떤 책을 찾고 있나요?"
			/>
			<form
				id="wanted-details"
				className="book-details-form"
				onSubmit={submit}
				noValidate
			>
				<div className="form-section-heading">
					<span>2</span>
					<div>
						<h2>동료에게 한마디 남겨요</h2>
						<p>왜 읽고 싶은지 적어두면 책을 가진 동료가 더 반가워해요.</p>
					</div>
				</div>

				{!book ? (
					<div className="book-selection-placeholder">
						<Search />
						<strong>먼저 위에서 책을 검색해 선택해 주세요</strong>
						<p>선택하면 표지와 기본 정보가 자동으로 채워져요.</p>
					</div>
				) : (
					<div className="selected-book-layout">
						<aside>
							<BookCover
								src={book.coverImageUrl || null}
								title={book.title}
								sizes="190px"
							/>
							<p>
								<CheckCircle2 size={16} /> 카카오 도서 정보
							</p>
						</aside>
						<div className="book-form-fields">
							<div className="book-form-field">
								<span>책</span>
								<strong>{book.title}</strong>
								<small>
									{book.author}
									{book.publisher && ` · ${book.publisher}`}
								</small>
							</div>
							<label className="book-form-field">
								<span>한마디 (선택)</span>
								<textarea
									rows={4}
									maxLength={500}
									placeholder="예: 팀에서 이 책 얘기가 자주 나와서 꼭 읽어보고 싶어요"
									value={message}
									onChange={(event) => setMessage(event.target.value)}
								/>
							</label>
							{error && (
								<p
									className="auth-error"
									role="alert"
								>
									{error}
								</p>
							)}
							<button
								className="book-save-button"
								type="submit"
								disabled={mutation.isPending}
							>
								{mutation.isPending ? (
									<>
										<LoaderCircle
											className="animate-spin"
											size={19}
										/>{' '}
										올리는 중
									</>
								) : (
									<>
										누가 갖고 있는지 물어보기
										<ArrowRight size={19} />
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</form>
		</div>
	);
}
