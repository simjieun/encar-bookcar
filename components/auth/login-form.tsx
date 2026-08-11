"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import {
  getSafeReturnTo,
  loginSchema,
  type LoginValues,
} from "@/lib/schemas/auth";
import { PasswordInput } from "./password-input";

function getLoginError(code?: string) {
  if (code === "INVALID_EMAIL_OR_PASSWORD") {
    return "이메일 또는 비밀번호를 다시 확인해 주세요.";
  }
  if (code === "TOO_MANY_REQUESTS") {
    return "로그인 시도가 많아요. 잠시 후 다시 시도해 주세요.";
  }
  return "로그인하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: true,
    });

    if (result.error) {
      setServerError(getLoginError(result.error.code));
      return;
    }

    router.replace(getSafeReturnTo(searchParams.get("returnTo")));
    router.refresh();
  });

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="field-group">
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>

      <div className="field-group">
        <label htmlFor="password">비밀번호</label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="비밀번호를 입력해 주세요"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password && (
          <p className="field-error">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="auth-error" role="alert">
          {serverError}
        </p>
      )}

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="animate-spin" size={19} /> 로그인 중
          </>
        ) : (
          <>
            로그인 <ArrowRight size={19} />
          </>
        )}
      </button>

      <p className="auth-switch">
        아직 계정이 없나요? <Link href="/signup">회원가입</Link>
      </p>
    </form>
  );
}
