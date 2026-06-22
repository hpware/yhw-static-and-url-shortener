-- Replace IP columns with location columns in shortener_analytics
ALTER TABLE "shortener_analytics" DROP COLUMN IF EXISTS "ip";
ALTER TABLE "shortener_analytics" DROP COLUMN IF EXISTS "ip_region";
ALTER TABLE "shortener_analytics" ADD COLUMN IF NOT EXISTS "country" text NOT NULL DEFAULT 'unknown';
ALTER TABLE "shortener_analytics" ADD COLUMN IF NOT EXISTS "city" text NOT NULL DEFAULT 'unknown';
ALTER TABLE "shortener_analytics" ADD COLUMN IF NOT EXISTS "region" text NOT NULL DEFAULT 'unknown';

-- Replace IP columns with location columns in site_analytics
ALTER TABLE "site_analytics" DROP COLUMN IF EXISTS "ip";
ALTER TABLE "site_analytics" DROP COLUMN IF EXISTS "ip_region";
ALTER TABLE "site_analytics" ADD COLUMN IF NOT EXISTS "country" text NOT NULL DEFAULT 'unknown';
ALTER TABLE "site_analytics" ADD COLUMN IF NOT EXISTS "city" text NOT NULL DEFAULT 'unknown';
ALTER TABLE "site_analytics" ADD COLUMN IF NOT EXISTS "region" text NOT NULL DEFAULT 'unknown';
