'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpenCheck, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { feedSchema, type FeedInput } from '@/lib/schemas/feed';
import type { FeedBookOption } from '@/lib/types/feed';
import { BookSelect } from './book-select';
import { MarkdownEditor } from './markdown-editor';

async function saveFeed(input: FeedInput, feedId?: string) {
	const response = await fetch(feedId ? `/api/feeds/${feedId}` : '/api/feeds', {
		method: feedId ? 'PATCH' : 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	});
	const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
	if (!response.ok || !payload.id) throw new Error(payload.message ?? '피드를 저장하지 못했어요.');
	return payload.id;
}

export function FeedForm({ books, initialValue, feedId }: { books: FeedBookOption[]; initialValue?: FeedInput; feedId?: string }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [serverError, setServerError] = useState<string | null>(null);
	const {
		register,
		handleSubmit,
		setValue,
		control,
		formState: { errors },
	} = useForm<FeedInput>({
		resolver: zodResolver(feedSchema),
		defaultValues: initialValue ?? { bookId: '', title: '', content: '' },
	});
	const bookId = useWatch({ control, name: 'bookId' });
	const mutation = useMutation({
		mutationFn: (input: FeedInput) => saveFeed(input, feedId),
		onSuccess: async (id) => {
			await queryClient.invalidateQueries({ queryKey: ['feeds'] });
			router.push(`/feeds/${id}`);
			router.refresh();
		},
		onError: (error) => setServerError(error.message),
	});

	if (!books.length) {
		return (
			<div className="feed-empty">
				<BookOpenCheck size={26} />
				<strong>아직 빌린 책이 없어요</strong>
				<p>피드는 내가 빌린 책에 대해서만 쓸 수 있어요. 먼저 책을 빌려보세요.</p>
				<Link href="/books">책 둘러보기</Link>
			</div>
		);
	}

	return (
		<form
			className="feed-form"
			onSubmit={handleSubmit((input) => mutation.mutate(input))}
			noValidate
		>
			<fieldset className="feed-book-picker">
				<legend>어떤 책에 대한 피드인가요?</legend>
				<p>내가 빌린 책 중에서 골라주세요.</p>
				<BookSelect
					books={books}
					value={bookId ?? ''}
					onChange={(id) => setValue('bookId', id, { shouldValidate: true })}
					error={errors.bookId?.message}
				/>
				<input
					type="hidden"
					{...register('bookId')}
				/>
			</fieldset>

			<label className="book-form-field">
				<span>제목</span>
				<input
					placeholder="예: 읽고 나서 팀 회고가 달라졌어요"
					{...register('title')}
				/>
				{errors.title?.message && <small>{errors.title.message}</small>}
			</label>

			<div className="book-form-field">
				<span>내용</span>
				<MarkdownEditor
					initialValue={initialValue?.content ?? ''}
					onChange={(markdown) => setValue('content', markdown, { shouldValidate: true })}
				/>
				<input
					type="hidden"
					{...register('content')}
				/>
				{errors.content?.message && <small>{errors.content.message}</small>}
			</div>

			{serverError && (
				<p
					className="auth-error"
					role="alert"
				>
					{serverError}
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
						저장하는 중
					</>
				) : (
					<>
						{feedId ? '수정 완료' : '피드 올리기'}
						<ArrowRight size={19} />
					</>
				)}
			</button>
		</form>
	);
}
