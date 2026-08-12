'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MemberPicker } from '@/components/members/member-picker';
import type { LoanView } from '@/lib/types/loan';

export function BorrowerManager({ bookId, currentBorrowerName, queue }: { bookId: string; currentBorrowerName: string | null; queue: LoanView[] }) {
	const first = queue[0];
	const [name, setName] = useState('');
	const [memberId, setMemberId] = useState('');
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: async (input: { borrowerId: string; borrowerName: string; makeAvailable: boolean }) => {
			const response = await fetch(`/api/books/${bookId}/borrower`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input),
			});
			const payload = (await response.json().catch(() => ({}))) as {
				message?: string;
			};
			if (!response.ok) throw new Error(payload.message ?? '대여자를 바꾸지 못했어요.');
		},
		onMutate: () => setError(null),
		onSuccess: async () => {
			setName('');
			setMemberId('');
			await Promise.all([queryClient.invalidateQueries({ queryKey: ['books'] }), queryClient.invalidateQueries({ queryKey: ['loans'] })]);
			router.refresh();
		},
		onError: (caught) => setError(caught.message),
	});

	return (
		<div className="borrower-manager">
			<div>
				<strong>대여자 변경</strong>
				<p>{first ? '예약 순서에 따라 첫 번째 동료에게 넘길 수 있어요.' : '회원 검색 또는 이름 직접 입력으로 변경할 수 있어요.'}</p>
			</div>
			{first ? (
				<button
					className="loan-action-button loan-action-primary"
					type="button"
					disabled={mutation.isPending}
					onClick={() =>
						mutation.mutate({
							borrowerId: first.borrowerId,
							borrowerName: first.borrowerName,
							makeAvailable: false,
						})
					}
				>
					{mutation.isPending ? (
						<LoaderCircle
							className="animate-spin"
							size={17}
						/>
					) : (
						<ArrowRight size={17} />
					)}
					{first.borrowerName}님에게 넘기기
				</button>
			) : (
				<>
					<MemberPicker
						label="새 대여자"
						name={name}
						memberId={memberId}
						onChange={(nextName, nextId) => {
							setName(nextName);
							setMemberId(nextId);
						}}
					/>
					<div className="borrower-manager-actions">
						<button
							className="loan-action-button loan-action-primary"
							type="button"
							disabled={!name.trim() || mutation.isPending}
							onClick={() =>
								mutation.mutate({
									borrowerId: memberId,
									borrowerName: name,
									makeAvailable: false,
								})
							}
						>
							대여자로 변경
						</button>
						{currentBorrowerName && (
							<button
								className="loan-action-button loan-action-secondary"
								type="button"
								disabled={mutation.isPending}
								onClick={() =>
									mutation.mutate({
										borrowerId: '',
										borrowerName: '',
										makeAvailable: true,
									})
								}
							>
								대여 가능으로 변경
							</button>
						)}
					</div>
				</>
			)}
			{error && (
				<small
					className="auth-error"
					role="alert"
				>
					{error}
				</small>
			)}
		</div>
	);
}
