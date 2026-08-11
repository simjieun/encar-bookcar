import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { books } from "@/db/schema";
import { listBooks, toBookRecord } from "@/lib/book-data";
import { bookListQuerySchema, bookSchema } from "@/lib/schemas/book";
import { getRequestSession } from "@/lib/request-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = bookListQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "검색 조건을 다시 확인해 주세요." },
      { status: 400 },
    );
  }

  return NextResponse.json(await listBooks(parsed.data));
}

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json(
      { message: "책을 등록하려면 먼저 로그인해 주세요." },
      { status: 401 },
    );
  }

  const parsed = bookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "입력 내용을 확인해 주세요.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const created = await getDb()
    .insert(books)
    .values({
      ...toBookRecord(parsed.data),
      ownerId: session.user.id,
    })
    .returning({ id: books.id });

  return NextResponse.json({ id: created[0].id }, { status: 201 });
}
