'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { LoanAction } from '@/lib/schemas/loan';

type Props = {
	label: string;
	bookId?: string;
	loanId?: string;
	action?: LoanAction;
	tone?: 'primary' | 'secondary' | 'danger';
	confirmMessage?: string;
};

export function LoanActionButton({ label, bookId, loanId, action, tone = 'primary', confirmMessage }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const mutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(loanId ? `/api/loans/${loanId}` : '/api/loans', {
				method: loanId ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(loanId ? { action } : { bookId }),
			});
			const payload = (await response.json().catch(() => ({}))) as {
				message?: string;
			};
			if (!response.ok) throw new Error(payload.message ?? '요청을 처리하지 못했어요.');
		},
		onMutate: () => setErrorMessage(null),
		onSuccess: async () => {
			await Promise.all([queryClient.invalidateQueries({ queryKey: ['books'] }), queryClient.invalidateQueries({ queryKey: ['loans'] })]);
			router.refresh();
		},
		onError: (error) => setErrorMessage(error.message),
	});

	function run() {
		if (confirmMessage && !window.confirm(confirmMessage)) return;
		mutation.mutate();
	}

	return (
		<span className="loan-action-control">
			<button
				className={`loan-action-button loan-action-${tone}`}
				type="button"
				disabled={mutation.isPending}
				onClick={run}
			>
				{mutation.isPending && (
					<LoaderCircle
						className="animate-spin"
						size={17}
					/>
				)}
				{mutation.isPending ? '처리 중' : label}
			</button>
			{errorMessage && <small role="alert">{errorMessage}</small>}
		</span>
	);
}
