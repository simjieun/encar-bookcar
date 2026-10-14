ALTER TABLE "books" ADD COLUMN "ownership" text DEFAULT 'CLUB' NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "recommendation" text;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_ownership_check" CHECK ("books"."ownership" in ('CLUB', 'PERSONAL'));