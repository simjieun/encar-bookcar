import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BookForm } from "@/components/books/book-form";
import { SiteHeader } from "@/components/site-header";
import { getCurrentSession } from "@/lib/auth-session";
import { getBook } from "@/lib/book-data";
import { bookStatusSchema, type BookInput } from "@/lib/schemas/book";

export const metadata: Metadata = { title: "책 수정 | 엔카북카" };
export const dynamic = "force-dynamic";

export default async function EditBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await getCurrentSession();
  if (!session) redirect(`/login?returnTo=/books/${bookId}/edit`);
  const book = await getBook(bookId).catch(() => null);
  if (!book) notFound();
  if (book.ownerId !== session.user.id) redirect(`/books/${bookId}`);
  const status = bookStatusSchema.safeParse(book.status);
  if (!status.success) notFound();
  const initialValue: BookInput = { title: book.title, author: book.author, description: book.description ?? "", coverImageUrl: book.coverImageUrl ?? "", publisher: book.publisher ?? "", isbn: book.isbn ?? "", publishedAt: book.publishedAt ?? "", sourceLink: book.sourceLink ?? "", location: book.location ?? "", status: status.data };
  return <main className="book-form-page"><SiteHeader userName={session.user.name} /><section className="book-form-hero compact"><p>EDIT BOOK</p><h1>책 정보를 수정해요</h1><span>대여 상태와 보관 장소도 최신 정보로 바꿔주세요.</span></section><BookForm initialValue={initialValue} bookId={bookId} /></main>;
}
