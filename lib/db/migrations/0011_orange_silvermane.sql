ALTER TABLE "NewsLetter" RENAME TO "PostContents";--> statement-breakpoint
ALTER TABLE "PostContents" DROP CONSTRAINT "NewsLetter_postId_NewsLetter_id_fk";
--> statement-breakpoint
ALTER TABLE "PostContents" ALTER COLUMN "postId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "PostContents" ADD COLUMN "userId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PostContents" ADD CONSTRAINT "PostContents_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
