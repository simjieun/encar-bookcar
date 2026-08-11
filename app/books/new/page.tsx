import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookForm } from "@/components/books/book-form";
import { SiteHeader } from "@/components/site-header";
import { getCurrentSession } from "@/lib/auth-session";

export const metadata: Metadata = { title: "책 등록 | 엔카북카", description: "카카오 책 검색으로 내 책을 간편하게 등록하세요." };
export const dynamic = "force-dynamic";

export default async function NewBookPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?returnTo=/books/new");
  return <main className="book-form-page"><SiteHeader userName={session.user.name} /><section className="book-form-hero"><p>ADD A BOOK</p><h1>좋은 책 한 권을<br />동료에게 건네요</h1><span>검색해서 선택하면 표지와 도서 정보가 자동으로 채워져요.</span></section><BookForm /></main>;
}
