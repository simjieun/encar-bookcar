import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { books } from "@/db/schema";
import { getBook, toBookRecord } from "@/lib/book-data";
import { bookSchema } from "@/lib/schemas/book";
import { getRequestSession } from "@/lib/request-session";

const bookIdSchema = z.uuid();

type Context = { params: Promise<{ bookId: string }> };

export async function GET(_request: Request, context: Context) {
  const { bookId } = await context.params;
  if (!bookIdSchema.safeParse(bookId).success) {
    return NextResponse.json({ message: "책을 찾을 수 없어요." }, { status: 404 });
  }

  const book = await getBook(bookId);
  if (!book) {
    return NextResponse.json({ message: "책을 찾을 수 없어요." }, { status: 404 });
  }
  return NextResponse.json({ book });
}

export async function PATCH(request: Request, context: Context) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ message: "로그인이 필요해요." }, { status: 401 });
  }

  const { bookId } = await context.params;
  if (!bookIdSchema.safeParse(bookId).success) {
    return NextResponse.json({ message: "책을 찾을 수 없어요." }, { status: 404 });
  }
  const current = await getBook(bookId);
  if (!current) {
    return NextResponse.json({ message: "책을 찾을 수 없어요." }, { status: 404 });
  }
  if (current.ownerId !== session.user.id) {
    return NextResponse.json(
      { message: "등록한 사람만 수정할 수 있어요." },
      { status: 403 },
    );
  }

  const parsed = bookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "입력 내용을 확인해 주세요.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await getDb().update(books).set(toBookRecord(parsed.data)).where(eq(books.id, bookId));
  return NextResponse.json({ id: bookId });
}

export async function DELETE(request: Request, context: Context) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ message: "로그인이 필요해요." }, { status: 401 });
  }

  const { bookId } = await context.params;
  if (!bookIdSchema.safeParse(bookId).success) {
    return NextResponse.json({ message: "책을 찾을 수 없어요." }, { status: 404 });
  }
  const current = await getBook(bookId);
  if (!current) {
    return NextResponse.json({ message: "책을 찾을 수 없어요." }, { status: 404 });
  }
  if (current.ownerId !== session.user.id) {
    return NextResponse.json(
      { message: "등록한 사람만 삭제할 수 있어요." },
      { status: 403 },
    );
  }

  await getDb().delete(books).where(eq(books.id, bookId));
  return new Response(null, { status: 204 });
}
