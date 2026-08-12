DROP INDEX "loans_one_active_per_book_idx";--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "current_borrower_id" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "current_borrower_name" text;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_current_borrower_id_user_id_fk" FOREIGN KEY ("current_borrower_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "loans" SET "status" = 'BORROWED', "borrowed_at" = COALESCE("borrowed_at", "approved_at", now()) WHERE "status" = 'APPROVED';--> statement-breakpoint
UPDATE "books" SET "current_borrower_id" = current_loan."borrower_id", "current_borrower_name" = current_loan."borrower_name", "status" = 'BORROWED'
FROM (
  SELECT "loans"."book_id", "loans"."borrower_id", "user"."name" AS "borrower_name"
  FROM "loans" INNER JOIN "user" ON "loans"."borrower_id" = "user"."id"
  WHERE "loans"."status" IN ('BORROWED', 'RETURN_REQUESTED')
) AS current_loan
WHERE "books"."id" = current_loan."book_id";--> statement-breakpoint
CREATE INDEX "books_current_borrower_id_idx" ON "books" USING btree ("current_borrower_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loans_one_current_borrower_idx" ON "loans" USING btree ("book_id") WHERE "loans"."status" in ('APPROVED', 'BORROWED', 'RETURN_REQUESTED');--> statement-breakpoint
CREATE UNIQUE INDEX "loans_one_reservation_per_member_idx" ON "loans" USING btree ("book_id","borrower_id") WHERE "loans"."status" = 'REQUESTED';--> statement-breakpoint
CREATE INDEX "loans_book_queue_idx" ON "loans" USING btree ("book_id","status","requested_at");
