'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { authClient } from '@/lib/auth-client';
import { changePasswordSchema, type ChangePasswordValues } from '@/lib/schemas/auth';
import { PasswordInput } from './password-input';

export function ChangePasswordForm() {
	const [serverError, setServerError] = useState<string | null>(null);
	const [done, setDone] = useState(false);
	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ChangePasswordValues>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { currentPassword: '', password: '', passwordConfirm: '' },
	});

	const password = useWatch({ control, name: 'password' }) ?? '';
	const passwordChecks = [
		{ label: '8자 이상', passed: password.length >= 8 },
		{ label: '영문 포함', passed: /[A-Za-z]/.test(password) },
		{ label: '숫자 포함', passed: /[0-9]/.test(password) },
	];

	const onSubmit = handleSubmit(async (values) => {
		setServerError(null);
		setDone(false);
		const result = await authClient.changePassword({
			currentPassword: values.currentPassword,
			newPassword: values.password,
			revokeOtherSessions: true,
		});

		if (result.error) {
			setServerError(
				result.error.code === 'INVALID_PASSWORD'
					? '현재 비밀번호가 맞지 않아요.'
					: '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.',
			);
			return;
		}

		reset();
		setDone(true);
	});

	return (
		<form
			className="auth-form"
			onSubmit={onSubmit}
			noValidate
		>
			<div className="field-group">
				<label htmlFor="currentPassword">현재 비밀번호</label>
				<PasswordInput
					id="currentPassword"
					autoComplete="current-password"
					placeholder="관리자에게 받은 임시 비밀번호도 여기에 입력해요"
					aria-invalid={Boolean(errors.currentPassword)}
					{...register('currentPassword')}
				/>
				{errors.currentPassword && <p className="field-error">{errors.currentPassword.message}</p>}
			</div>

			<div className="field-group">
				<label htmlFor="newPassword">새 비밀번호</label>
				<PasswordInput
					id="newPassword"
					autoComplete="new-password"
					placeholder="새 비밀번호를 만들어 주세요"
					aria-invalid={Boolean(errors.password)}
					{...register('password')}
				/>
				<div
					className="password-checks"
					aria-label="비밀번호 조건"
				>
					{passwordChecks.map((check) => (
						<span
							className={check.passed ? 'is-passed' : ''}
							key={check.label}
						>
							<Check size={14} /> {check.label}
						</span>
					))}
				</div>
				{errors.password && <p className="field-error">{errors.password.message}</p>}
			</div>

			<div className="field-group">
				<label htmlFor="newPasswordConfirm">새 비밀번호 확인</label>
				<PasswordInput
					id="newPasswordConfirm"
					autoComplete="new-password"
					placeholder="비밀번호를 한 번 더 입력해 주세요"
					aria-invalid={Boolean(errors.passwordConfirm)}
					{...register('passwordConfirm')}
				/>
				{errors.passwordConfirm && <p className="field-error">{errors.passwordConfirm.message}</p>}
			</div>

			{serverError && (
				<p
					className="auth-error"
					role="alert"
				>
					{serverError}
				</p>
			)}

			{done && (
				<p
					className="auth-notice"
					role="status"
				>
					<ShieldCheck size={18} /> <span>비밀번호를 바꿨어요. 다른 기기의 로그인은 모두 해제됐습니다.</span>
				</p>
			)}

			<button
				className="auth-submit"
				type="submit"
				disabled={isSubmitting}
			>
				{isSubmitting ? (
					<>
						<LoaderCircle
							className="animate-spin"
							size={19}
						/>{' '}
						바꾸는 중
					</>
				) : (
					'비밀번호 바꾸기'
				)}
			</button>
		</form>
	);
}
