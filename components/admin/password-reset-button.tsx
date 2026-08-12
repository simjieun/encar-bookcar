'use client';

import { Copy, KeyRound, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { createTemporaryPassword } from '@/lib/schemas/auth';

type PasswordResetButtonProps = {
	userId: string;
	userName: string;
};

export function PasswordResetButton({ userId, userName }: PasswordResetButtonProps) {
	const [pending, setPending] = useState(false);
	const [issued, setIssued] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const onReset = async () => {
		setPending(true);
		setError(null);
		const temporaryPassword = createTemporaryPassword();
		const result = await authClient.admin.setUserPassword({ userId, newPassword: temporaryPassword });
		setPending(false);

		if (result.error) {
			setError(result.error.code === 'FORBIDDEN' ? '초기화 권한이 없어요.' : '초기화하지 못했어요. 잠시 후 다시 시도해 주세요.');
			return;
		}

		setIssued(temporaryPassword);
		setCopied(false);
	};

	const onCopy = async () => {
		if (!issued) {
			return;
		}
		await navigator.clipboard.writeText(issued);
		setCopied(true);
	};

	// 발급된 임시 비밀번호는 이 화면을 벗어나면 다시 볼 수 없다. 다시 필요하면 재발급한다.
	if (issued) {
		return (
			<div className="member-issued">
				<code>{issued}</code>
				<button
					type="button"
					onClick={onCopy}
				>
					<Copy size={15} /> {copied ? '복사됨' : '복사'}
				</button>
			</div>
		);
	}

	return (
		<div className="member-reset">
			<button
				className="member-reset-button"
				type="button"
				onClick={onReset}
				disabled={pending}
			>
				{pending ? (
					<>
						<LoaderCircle
							className="animate-spin"
							size={15}
						/>{' '}
						초기화 중
					</>
				) : (
					<>
						<KeyRound size={15} /> 초기화
					</>
				)}
			</button>
			{error && (
				<p
					className="field-error"
					role="alert"
				>
					{userName}: {error}
				</p>
			)}
		</div>
	);
}
