import Link from "next/link";
import { BOOK_STATUS_LABELS } from "@/lib/schemas/book";
import type { BookView } from "@/lib/types/book";
import { BookCover } from "./book-cover";

export function BookCard({ book }: { book: BookView }) {
  return (
    <Link className="book-card book-card-real" href={`/books/${book.id}`}>
      <BookCover src={book.coverImageUrl} title={book.title} />
      <div className="mt-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3>{book.title}</h3>
            <p>{book.author}</p>
          </div>
          <span className={`status status-${book.status.toLowerCase()}`}>
            {BOOK_STATUS_LABELS[book.status]}
          </span>
        </div>
        <p className="owner">{book.ownerName} 님의 책</p>
      </div>
    </Link>
  );
}
