'use client';

import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BOOK_OWNERSHIP_LABELS, type BookOwnership } from '@/lib/schemas/book';

type TransferBook = { id: string; title: string; author: string; ownership: BookOwnership; ownerName: string };
type Member = { id: string; name: string; email: string };

async function transfer(body: { bookIds: string[]; ownership: BookOwnership; ownerId: string }) {
	const response = await fetch('/api/admin/books/ownership', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const payload = (await response.json().catch(() => ({}))) as { updated?: number; message?: string };
	if (!response.ok) throw new Error(payload.message ?? '이관하지 못했어요. 잠시 후 다시 시도해 주세요.');
	return payload.updated ?? 0;
}

export function BookOwnershipTransfer({ books, members }: { books: TransferBook[]; members: Member[] }) {
	const router = useRouter();
	const [selected, setSelected] = useState<string[]>([]);
	const [ownerId, setOwnerId] = useState('');
	const [notice, setNotice] = useState<string | null>(null);
	const mutation = useMutation({
		mutationFn: transfer,
		onSuccess: (updated, variables) => {
			setNotice(`${updated}권을 ${BOOK_OWNERSHIP_LABELS[variables.ownership]}(으)로 옮겼어요.`);
			setSelected([]);
			router.refresh();
		},
		onError: () => setNotice(null),
	});

	function toggle(bookId: string) {
		setSelected((current) => (current.includes(bookId) ? current.filter((id) => id !== bookId) : [...current, bookId]));
	}

	return (
		<>
			<div className="admin-transfer-bar">
				<strong>{selected.length}권 선택</strong>
				<select
					value={ownerId}
					onChange={(event) => setOwnerId(event.target.value)}
					aria-label="책을 소장한 동료"
				>
					<option value="">소장한 동료 선택</option>
					{members.map((member) => (
						<option
							key={member.id}
							value={member.id}
						>
							{member.name} ({member.email})
						</option>
					))}
				</select>
				<button
					className="member-reset-button"
					type="button"
					disabled={!selected.length || !ownerId || mutation.isPending}
					onClick={() => mutation.mutate({ bookIds: selected, ownership: 'PERSONAL', ownerId })}
				>
					{mutation.isPending && (
						<LoaderCircle
							className="animate-spin"
							size={15}
						/>
					)}
					동료의 서재로 이관
				</button>
				<button
					className="member-reset-button"
					type="button"
					disabled={!selected.length || mutation.isPending}
					onClick={() => mutation.mutate({ bookIds: selected, ownership: 'CLUB', ownerId: '' })}
				>
					북클럽 책으로 되돌리기
				</button>
			</div>
			{mutation.error && (
				<p
					className="field-error"
					role="alert"
				>
					{mutation.error.message}
				</p>
			)}
			{notice && <p className="admin-guide">{notice}</p>}

			<ul className="member-list">
				{books.map((book) => (
					<li key={book.id}>
						<label className="admin-book-row">
							<input
								type="checkbox"
								checked={selected.includes(book.id)}
								onChange={() => toggle(book.id)}
							/>
							<span className="member-info">
								<strong>{book.title}</strong>
								<span>
									{book.author} · {book.ownerName} 님
								</span>
							</span>
						</label>
						{book.ownership === 'PERSONAL' ? <span className="book-ribbon">개인 소장</span> : <span className="status status-unavailable">북클럽 책</span>}
					</li>
				))}
			</ul>
		</>
	);
}
