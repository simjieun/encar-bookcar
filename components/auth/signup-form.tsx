'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { authClient } from '@/lib/auth-client';
import { getSafeReturnTo, signupSchema, type SignupValues } from '@/lib/schemas/auth';
import { PasswordInput } from './password-input';

function getSignupError(code?: string, message?: string) {
	if (code === 'USER_ALREADY_EXISTS' || code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
		return '이미 가입한 이메일이에요. 로그인해 주세요.';
	}
	if (message?.includes('회사에서 허용한')) {
		return message;
	}
	if (code === 'TOO_MANY_REQUESTS') {
		return '가입 시도가 많아요. 잠시 후 다시 시도해 주세요.';
	}
	return '가입을 완료하지 못했어요. 입력 내용을 확인해 주세요.';
}

export function SignupForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isRedirecting, setIsRedirecting] = useState(false);
	const {
		register,
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignupValues>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			name: '',
			email: '',
			password: '',
			passwordConfirm: '',
		},
	});

	const password = useWatch({ control, name: 'password' }) ?? '';
	const passwordChecks = [
		{ label: '8자 이상', passed: password.length >= 8 },
		{ label: '영문 포함', passed: /[A-Za-z]/.test(password) },
		{ label: '숫자 포함', passed: /[0-9]/.test(password) },
	];

	const onSubmit = handleSubmit(async (values) => {
		setServerError(null);
		const result = await authClient.signUp.email({
			name: values.name.trim(),
			email: values.email,
			password: values.password,
		});

		if (result.error) {
			setServerError(getSignupError(result.error.code, result.error.message));
			return;
		}

		setIsRedirecting(true);
		router.replace(getSafeReturnTo(searchParams.get('returnTo')));
		router.refresh();
	});

	return (
		<form
			className="auth-form"
			onSubmit={onSubmit}
			noValidate
		>
			<div className="field-group">
				<label htmlFor="name">이름</label>
				<input
					id="name"
					type="text"
					autoComplete="name"
					placeholder="동료에게 보일 이름"
					aria-invalid={Boolean(errors.name)}
					{...register('name')}
				/>
				{errors.name && <p className="field-error">{errors.name.message}</p>}
			</div>

			<div className="field-group">
				<label htmlFor="email">회사 이메일</label>
				<input
					id="email"
					type="email"
					autoComplete="email"
					placeholder="name@encar.com"
					aria-invalid={Boolean(errors.email)}
					{...register('email')}
				/>
				{errors.email && <p className="field-error">{errors.email.message}</p>}
			</div>

			<div className="field-group">
				<label htmlFor="password">비밀번호</label>
				<PasswordInput
					id="password"
					autoComplete="new-password"
					placeholder="안전한 비밀번호를 만들어 주세요"
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
				<label htmlFor="passwordConfirm">비밀번호 확인</label>
				<PasswordInput
					id="passwordConfirm"
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

			<button
				className="auth-submit"
				type="submit"
				disabled={isSubmitting || isRedirecting}
			>
				{isSubmitting || isRedirecting ? (
					<>
						<LoaderCircle
							className="animate-spin"
							size={19}
						/>{' '}
						계정 만드는 중
					</>
				) : (
					<>
						엔카북카 시작하기 <ArrowRight size={19} />
					</>
				)}
			</button>

			<p className="auth-switch">
				이미 계정이 있나요? <Link href="/login">로그인</Link>
			</p>
		</form>
	);
}
