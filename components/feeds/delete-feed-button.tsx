'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DeleteFeedButton({ feedId }: { feedId: string }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(`/api/feeds/${feedId}`, { method: 'DELETE' });
			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as { message?: string };
				throw new Error(payload.message ?? '피드를 삭제하지 못했어요.');
			}
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['feeds'] });
			router.replace('/feeds');
			router.refresh();
		},
	});

	return (
		<span className="book-delete-control">
			<button
				className="book-delete-button"
				type="button"
				disabled={mutation.isPending}
				onClick={() => {
					if (window.confirm('이 피드를 정말 삭제할까요?')) mutation.mutate();
				}}
			>
				<Trash2 size={17} />
				{mutation.isPending ? '삭제 중' : '삭제'}
			</button>
			{mutation.isError && <small role="alert">{mutation.error.message}</small>}
		</span>
	);
}
