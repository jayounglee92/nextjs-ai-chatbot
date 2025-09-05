CREATE TABLE IF NOT EXISTS "NewsLetter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"content" text NOT NULL,
	"category" text,
	"tags" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "NewsLetter" ADD CONSTRAINT "NewsLetter_postId_NewsLetter_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."NewsLetter"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
