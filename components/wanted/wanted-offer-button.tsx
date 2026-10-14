'use client';

import { useMutation } from '@tanstack/react-query';
import { Hand } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function WantedOfferButton({ wantedId, offered }: { wantedId: string; offered: boolean }) {
	const router = useRouter();
	const mutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(`/api/wanted/${wantedId}/offers`, { method: 'POST' });
			const payload = (await response.json().catch(() => ({}))) as { message?: string };
			if (!response.ok) throw new Error(payload.message ?? '응답을 남기지 못했어요.');
		},
		onSuccess: () => router.refresh(),
	});

	return (
		<span className="book-delete-control">
			<button
				className={offered ? 'loan-action-button loan-action-secondary' : 'loan-action-button loan-action-primary'}
				type="button"
				aria-pressed={offered}
				disabled={mutation.isPending}
				onClick={() => mutation.mutate()}
			>
				<Hand size={17} />
				{offered ? '있어요 취소' : '나 그거 있어요'}
			</button>
			{mutation.isError && <small role="alert">{mutation.error.message}</small>}
		</span>
	);
}
