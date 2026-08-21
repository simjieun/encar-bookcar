ALTER TABLE "feed_comments" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_parent_id_feed_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."feed_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feed_comments_parent_id_idx" ON "feed_comments" USING btree ("parent_id");