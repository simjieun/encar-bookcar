import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "회원가입 | 엔카북카",
  description: "회사 이메일로 가입하고 동료와 좋은 책을 나눠보세요.",
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/profile");
  }

  return (
    <AuthShell
      eyebrow="우리 회사의 작은 도서관"
      title="함께 읽을 준비가 됐나요?"
      description="회사 이메일로 계정을 만들고 첫 번째 책을 발견해 보세요."
    >
      <Suspense fallback={<div className="auth-form-skeleton" />}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
