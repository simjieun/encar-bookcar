'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { WantedStatus } from '@/lib/schemas/wanted';

async function request(url: string, init: RequestInit, fallback: string) {
	const response = await fetch(url, init);
	if (!response.ok) {
		const payload = (await response.json().catch(() => ({}))) as { message?: string };
		throw new Error(payload.message ?? fallback);
	}
}

/** 요청자는 해결 처리와 삭제, 관리자는 삭제만 한다. */
export function WantedActions({ wantedId, status, canChangeStatus }: { wantedId: string; status: WantedStatus; canChangeStatus: boolean }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const statusMutation = useMutation({
		mutationFn: () =>
			request(
				`/api/wanted/${wantedId}`,
				{ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status === 'OPEN' ? 'FOUND' : 'OPEN' }) },
				'상태를 바꾸지 못했어요.',
			),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['wanted'] });
			router.refresh();
		},
	});
	const deleteMutation = useMutation({
		mutationFn: () => request(`/api/wanted/${wantedId}`, { method: 'DELETE' }, '요청을 삭제하지 못했어요.'),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['wanted'] });
			router.replace('/wanted');
			router.refresh();
		},
	});
	const error = statusMutation.error ?? deleteMutation.error;

	return (
		<>
			{canChangeStatus && (
				<button
					type="button"
					disabled={statusMutation.isPending}
					onClick={() => statusMutation.mutate()}
				>
					{status === 'OPEN' ? <CheckCircle2 size={16} /> : <RotateCcw size={16} />}
					{status === 'OPEN' ? '구했어요' : '다시 찾기'}
				</button>
			)}
			<span className="book-delete-control">
				<button
					className="book-delete-button"
					type="button"
					disabled={deleteMutation.isPending}
					onClick={() => {
						if (window.confirm('이 요청을 정말 삭제할까요?')) deleteMutation.mutate();
					}}
				>
					<Trash2 size={17} />
					{deleteMutation.isPending ? '삭제 중' : '삭제'}
				</button>
				{error && <small role="alert">{error.message}</small>}
			</span>
		</>
	);
}
