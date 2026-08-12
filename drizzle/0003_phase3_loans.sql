CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"borrower_id" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"borrowed_at" timestamp with time zone,
	"return_requested_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loans_status_check" CHECK ("loans"."status" in ('REQUESTED', 'APPROVED', 'REJECTED', 'BORROWED', 'RETURN_REQUESTED', 'RETURNED', 'CANCELLED'))
);
--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_id_user_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "loans_book_id_idx" ON "loans" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "loans_borrower_id_idx" ON "loans" USING btree ("borrower_id");--> statement-breakpoint
CREATE INDEX "loans_status_requested_at_idx" ON "loans" USING btree ("status","requested_at");--> statement-breakpoint
CREATE UNIQUE INDEX "loans_one_active_per_book_idx" ON "loans" USING btree ("book_id") WHERE "loans"."status" in ('REQUESTED', 'APPROVED', 'BORROWED', 'RETURN_REQUESTED');