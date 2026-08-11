ALTER TABLE "books" ADD COLUMN "publisher" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "isbn" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "published_at" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "naver_link" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "status" text DEFAULT 'AVAILABLE' NOT NULL;--> statement-breakpoint
CREATE INDEX "books_isbn_idx" ON "books" USING btree ("isbn");--> statement-breakpoint
CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "books_status_created_at_idx" ON "books" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_status_check" CHECK ("books"."status" in ('AVAILABLE', 'BORROWED', 'UNAVAILABLE'));