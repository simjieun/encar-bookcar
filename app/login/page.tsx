import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "로그인 | 엔카북카",
  description: "엔카북카에 로그인하고 동료의 책을 만나보세요.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/profile");
  }

  return (
    <AuthShell
      eyebrow="다시 만나서 반가워요"
      title="엔카북카 로그인"
      description="동료들이 나누는 좋은 책을 계속 만나보세요."
    >
      <Suspense fallback={<div className="auth-form-skeleton" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
