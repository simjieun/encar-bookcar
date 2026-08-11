"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { bookSchema, type BookInput } from "@/lib/schemas/book";
import type { KakaoBook } from "@/lib/types/book";
import { BookCover } from "./book-cover";
import { KakaoBookSearch } from "./kakao-book-search";

const emptyBook: BookInput = {
  title: "", author: "", description: "", coverImageUrl: "", publisher: "",
  isbn: "", publishedAt: "", sourceLink: "", location: "", status: "AVAILABLE",
};

async function saveBook(input: BookInput, bookId?: string) {
  const response = await fetch(bookId ? `/api/books/${bookId}` : "/api/books", {
    method: bookId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok || !payload.id) throw new Error(payload.message ?? "책을 저장하지 못했어요.");
  return payload.id;
}

export function BookForm({ initialValue, bookId }: { initialValue?: BookInput; bookId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(Boolean(initialValue?.title));
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, reset, handleSubmit, control, formState: { errors } } = useForm<BookInput>({
    resolver: zodResolver(bookSchema),
    defaultValues: initialValue ?? emptyBook,
  });
  const values = useWatch({ control });
  const mutation = useMutation({
    mutationFn: (input: BookInput) => saveBook(input, bookId),
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ["books"] });
      router.push(`/books/${id}`);
      router.refresh();
    },
    onError: (error) => setServerError(error.message),
  });

  function selectBook(book: KakaoBook) {
    reset({ ...emptyBook, ...book, location: values.location ?? "", status: values.status ?? "AVAILABLE" });
    setSelected(true);
    setServerError(null);
    window.setTimeout(() => document.getElementById("book-details")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="book-form-flow">
      {!bookId && <KakaoBookSearch onSelect={selectBook} />}
      <form id="book-details" className="book-details-form" onSubmit={handleSubmit((input) => mutation.mutate(input))} noValidate>
        <div className="form-section-heading"><span>{bookId ? "1" : "2"}</span><div><h2>{bookId ? "책 정보를 수정해요" : "책 정보를 확인해요"}</h2><p>필요한 내용을 다듬고 보관 장소를 알려주세요.</p></div></div>

        {!selected && !bookId ? (
          <div className="book-selection-placeholder"><SearchIcon /><strong>먼저 위에서 책을 검색해 선택해 주세요</strong><p>선택하면 표지와 기본 정보가 자동으로 채워져요.</p></div>
        ) : (
          <div className="selected-book-layout">
            <aside><BookCover src={values.coverImageUrl || null} title={values.title || "책"} priority /><p><CheckCircle2 size={16} /> 카카오 도서 정보</p></aside>
            <div className="book-form-fields">
              <Field label="책 제목" error={errors.title?.message}><input {...register("title")} /></Field>
              <Field label="저자" error={errors.author?.message}><input {...register("author")} /></Field>
              <div className="form-field-row">
                <Field label="출판사" error={errors.publisher?.message}><input {...register("publisher")} /></Field>
                <Field label="ISBN" error={errors.isbn?.message}><input {...register("isbn")} /></Field>
              </div>
              <Field label="책 소개" error={errors.description?.message}><textarea rows={6} {...register("description")} /></Field>
              <Field label="보관 장소 또는 전달 방법" error={errors.location?.message}><input placeholder="예: 판교 오피스 8층, 사내 우편 가능" {...register("location")} /></Field>
              <Field label="현재 상태" error={errors.status?.message}>
                <select {...register("status")}><option value="AVAILABLE">대여 가능</option><option value="BORROWED">대여 중</option><option value="UNAVAILABLE">대여 불가</option></select>
              </Field>
              <input type="hidden" {...register("coverImageUrl")} /><input type="hidden" {...register("publishedAt")} /><input type="hidden" {...register("sourceLink")} />
              {serverError && <p className="auth-error" role="alert">{serverError}</p>}
              <button className="book-save-button" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <><LoaderCircle className="animate-spin" size={19} /> 저장하는 중</> : <>{bookId ? "수정 완료" : "내 책으로 등록하기"}<ArrowRight size={19} /></>}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="book-form-field"><span>{label}</span>{children}{error && <small>{error}</small>}</label>;
}

function SearchIcon() {
  return <span aria-hidden="true" className="selection-search-icon">⌕</span>;
}
