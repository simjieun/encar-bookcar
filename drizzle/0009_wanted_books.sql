CREATE TABLE "wanted_book_offers" (
	"wanted_book_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wanted_book_offers_wanted_book_id_user_id_pk" PRIMARY KEY("wanted_book_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "wanted_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"publisher" text,
	"isbn" text,
	"cover_image_url" text,
	"published_at" text,
	"source_link" text,
	"message" text,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wanted_books_status_check" CHECK ("wanted_books"."status" in ('OPEN', 'FOUND'))
);
--> statement-breakpoint
ALTER TABLE "wanted_book_offers" ADD CONSTRAINT "wanted_book_offers_wanted_book_id_wanted_books_id_fk" FOREIGN KEY ("wanted_book_id") REFERENCES "public"."wanted_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wanted_book_offers" ADD CONSTRAINT "wanted_book_offers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wanted_books" ADD CONSTRAINT "wanted_books_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wanted_books_status_created_at_idx" ON "wanted_books" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "wanted_books_requester_id_idx" ON "wanted_books" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "wanted_books_isbn_idx" ON "wanted_books" USING btree ("isbn");