import type { Metadata } from "next";
import { BookCatalog } from "@/components/books/book-catalog";
import { SiteHeader } from "@/components/site-header";
import { getCurrentSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "책 둘러보기 | 엔카북카",
  description: "동료가 등록한 책을 제목과 저자로 검색해 보세요.",
};
export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const session = await getCurrentSession();
  return (
    <main className="books-page">
      <SiteHeader userName={session?.user.name} />
      <section className="books-page-hero">
        <p>OUR LIBRARY</p><h1>동료의 책장에서<br />다음 책을 발견해요</h1><span>제목이나 저자로 검색하고, 지금 빌릴 수 있는 책을 확인해 보세요.</span>
      </section>
      <section className="books-catalog-section"><BookCatalog /></section>
    </main>
  );
}
