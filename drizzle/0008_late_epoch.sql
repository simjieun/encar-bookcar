CREATE TABLE "feed_comment_reactions" (
	"comment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_comment_reactions_comment_id_user_id_emoji_pk" PRIMARY KEY("comment_id","user_id","emoji")
);
--> statement-breakpoint
ALTER TABLE "feed_comment_reactions" ADD CONSTRAINT "feed_comment_reactions_comment_id_feed_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."feed_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_comment_reactions" ADD CONSTRAINT "feed_comment_reactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;