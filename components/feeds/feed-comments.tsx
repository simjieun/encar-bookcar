'use client';

import { useMutation } from '@tanstack/react-query';
import { CornerDownRight, LoaderCircle, MessageCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { feedCommentSchema } from '@/lib/schemas/feed';
import type { FeedCommentThread, FeedCommentView } from '@/lib/types/feed';

const dateFormat = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export function FeedComments({ feedId, comments, viewerId }: { feedId: string; comments: FeedCommentThread[]; viewerId: string | null }) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	// 답글 폼은 한 번에 하나만 열어둔다.
	const [replyTo, setReplyTo] = useState<string | null>(null);
	const total = comments.reduce((sum, thread) => sum + 1 + thread.replies.length, 0);

	const create = useMutation({
		mutationFn: async ({ content, parentId }: { content: string; parentId: string }) => {
			const response = await fetch(`/api/feeds/${feedId}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content, parentId }),
			});
			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as { message?: string };
				throw new Error(payload.message ?? '댓글을 남기지 못했어요.');
			}
		},
		onSuccess: () => {
			setError(null);
			setReplyTo(null);
			router.refresh();
		},
		onError: (mutationError) => setError(mutationError.message),
	});

	const remove = useMutation({
		mutationFn: async (commentId: string) => {
			const response = await fetch(`/api/feeds/${feedId}/comments/${commentId}`, { method: 'DELETE' });
			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as { message?: string };
				throw new Error(payload.message ?? '댓글을 삭제하지 못했어요.');
			}
		},
		onSuccess: () => router.refresh(),
		onError: (mutationError) => setError(mutationError.message),
	});

	function submit(content: string, parentId: string) {
		const parsed = feedCommentSchema.safeParse({ content, parentId });
		if (!parsed.success) {
			setError(parsed.error.issues[0].message);
			return false;
		}
		create.mutate({ content: parsed.data.content, parentId: parsed.data.parentId });
		return true;
	}

	function commentBody(comment: FeedCommentView, isReply: boolean) {
		const isReplyTarget = replyTo === comment.id;
		return (
			<>
				<div>
					{isReply && (
						<CornerDownRight
							size={14}
							aria-hidden="true"
						/>
					)}
					<strong>{comment.authorName}님</strong>
					<small>{dateFormat.format(new Date(comment.createdAt))}</small>
				</div>
				<p>{comment.content}</p>
				<div className="feed-comment-actions">
					{/* 대댓글에는 답글 버튼을 두지 않는다 — 중첩은 1단계까지다. */}
					{viewerId && !isReply && (
						<button
							type="button"
							onClick={() => {
								setError(null);
								setReplyTo(isReplyTarget ? null : comment.id);
							}}
						>
							{isReplyTarget ? '답글 취소' : '답글'}
						</button>
					)}
					{viewerId === comment.authorId && (
						<button
							type="button"
							className="is-danger"
							disabled={remove.isPending}
							onClick={() => {
								const message = isReply ? '답글을 삭제할까요?' : '댓글을 삭제할까요? 달린 답글도 함께 사라져요.';
								if (window.confirm(message)) remove.mutate(comment.id);
							}}
						>
							<Trash2 size={14} /> 삭제
						</button>
					)}
				</div>
			</>
		);
	}

	return (
		<section className="feed-comments">
			<h2>
				<MessageCircle size={19} /> 댓글 {total}
			</h2>

			{comments.length ? (
				<ul className="feed-comment-list">
					{comments.map((thread) => (
						<li key={thread.id}>
							{commentBody(thread, false)}
							{(thread.replies.length > 0 || replyTo === thread.id) && (
								<ul className="feed-reply-list">
									{thread.replies.map((reply) => (
										<li key={reply.id}>{commentBody(reply, true)}</li>
									))}
									{replyTo === thread.id && (
										<li className="feed-reply-form-row">
											<CommentForm
												placeholder={`${thread.authorName}님에게 답글 남기기`}
												pending={create.isPending}
												submitLabel="답글 남기기"
												autoFocus
												onSubmit={(content) => submit(content, thread.id)}
											/>
										</li>
									)}
								</ul>
							)}
						</li>
					))}
				</ul>
			) : (
				<p className="feed-comment-empty">첫 번째 댓글을 남겨보세요.</p>
			)}

			{viewerId ? (
				<CommentForm
					placeholder="이 책에 대한 생각을 남겨주세요"
					pending={create.isPending}
					submitLabel="댓글 남기기"
					onSubmit={(content) => submit(content, '')}
				/>
			) : (
				<p className="feed-comment-empty">
					<Link href={`/login?returnTo=/feeds/${feedId}`}>로그인</Link>하면 댓글을 남길 수 있어요.
				</p>
			)}

			{error && (
				<p
					className="auth-error"
					role="alert"
				>
					{error}
				</p>
			)}
		</section>
	);
}

function CommentForm({
	placeholder,
	submitLabel,
	pending,
	autoFocus = false,
	onSubmit,
}: {
	placeholder: string;
	submitLabel: string;
	pending: boolean;
	autoFocus?: boolean;
	/** 검증까지 통과해 전송했으면 true — 그때만 입력값을 비운다. */
	onSubmit: (content: string) => boolean;
}) {
	const [content, setContent] = useState('');

	return (
		<form
			className="feed-comment-form"
			onSubmit={(event) => {
				event.preventDefault();
				if (onSubmit(content)) setContent('');
			}}
		>
			<textarea
				rows={3}
				value={content}
				onChange={(event) => setContent(event.target.value)}
				placeholder={placeholder}
				autoFocus={autoFocus}
			/>
			<button
				type="submit"
				disabled={pending}
			>
				{pending ? (
					<LoaderCircle
						className="animate-spin"
						size={17}
					/>
				) : null}
				{submitLabel}
			</button>
		</form>
	);
}
