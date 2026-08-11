import type { BookStatus } from "@/lib/schemas/book";

export type BookView = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverImageUrl: string | null;
  publisher: string | null;
  isbn: string | null;
  publishedAt: string | null;
  sourceLink: string | null;
  location: string | null;
  status: BookStatus;
  ownerId: string;
  ownerName: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type KakaoBook = {
  title: string;
  author: string;
  publisher: string;
  description: string;
  coverImageUrl: string;
  isbn: string;
  publishedAt: string;
  sourceLink: string;
};
