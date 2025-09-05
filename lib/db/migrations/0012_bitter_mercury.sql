-- Drop existing PostContents table
DROP TABLE IF EXISTS "PostContents";

-- Create Posts table
CREATE TABLE IF NOT EXISTS "Posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"summaryType" text DEFAULT 'auto_truncated' NOT NULL,
	"thumbnailUrl" text,
	"userId" uuid NOT NULL,
	"postType" text NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"openType" text DEFAULT 'page',
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
-- Recreate PostContents table with correct postId type
CREATE TABLE IF NOT EXISTS "PostContents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"content" text NOT NULL,
	"category" text,
	"tags" text,
	"userId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Posts" ADD CONSTRAINT "Posts_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PostContents" ADD CONSTRAINT "PostContents_postId_Posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Posts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
