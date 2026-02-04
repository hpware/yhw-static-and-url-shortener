ALTER TABLE "shortener_analytics" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "shortener_analytics" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "shortener_analytics" ALTER COLUMN "ref_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "shortener_data" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "shortener_data" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();