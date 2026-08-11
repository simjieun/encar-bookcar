"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, SearchX } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { KakaoBook } from "@/lib/types/book";
import { BookCover } from "./book-cover";

type SearchResponse = { total: number; items: KakaoBook[] };

async function searchKakaoBooks(query: string) {
  const response = await fetch(`/api/kakao/books?query=${encodeURIComponent(query)}`);
  const payload = (await response.json()) as SearchResponse & { message?: string };
  if (!response.ok) throw new Error(payload.message ?? "책을 검색하지 못했어요.");
  return payload;
}

export function KakaoBookSearch({ onSelect }: { onSelect: (book: KakaoBook) => void }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const result = useQuery({
    queryKey: ["kakao-books", query],
    queryFn: () => searchKakaoBooks(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60_000,
    retry: false,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setQuery(input.trim());
  }

  return (
    <section className="kakao-search-panel" aria-labelledby="kakao-search-heading">
      <div className="form-section-heading">
        <span>1</span>
        <div><h2 id="kakao-search-heading">어떤 책을 등록할까요?</h2><p>카카오 책 검색에서 표지와 도서 정보를 가져와요.</p></div>
      </div>
      <form className="kakao-search-form" onSubmit={submit}>
        <Search size={21} aria-hidden="true" />
        <label className="sr-only" htmlFor="kakao-book-query">카카오 책 검색</label>
        <input id="kakao-book-query" value={input} onChange={(event) => setInput(event.target.value)} placeholder="책 제목, 저자 또는 ISBN" minLength={2} required />
        <button type="submit" disabled={input.trim().length < 2 || result.isFetching}>검색</button>
      </form>

      {result.isFetching && <div className="kakao-search-message">카카오에서 책을 찾고 있어요…</div>}
      {result.isError && <div className="kakao-search-error" role="alert">{result.error.message}<small>관리자에게 카카오 책 검색 설정을 확인해 달라고 알려주세요.</small></div>}
      {result.data && result.data.items.length === 0 && <div className="kakao-search-message"><SearchX size={22} />검색 결과가 없어요. 다른 검색어를 입력해 보세요.</div>}
      {result.data && result.data.items.length > 0 && (
        <div className="kakao-result-list" aria-label="카카오 책 검색 결과">
          {result.data.items.map((book, index) => (
            <button type="button" className="kakao-result-item" key={`${book.isbn}-${index}`} onClick={() => onSelect(book)}>
              <BookCover src={book.coverImageUrl} title={book.title} />
              <span><strong>{book.title}</strong><small>{book.author || "저자 정보 없음"}</small><em>{book.publisher}</em></span>
              <b>선택</b>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
