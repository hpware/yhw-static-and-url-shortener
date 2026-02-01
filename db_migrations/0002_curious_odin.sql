CREATE TABLE "shortener_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"ip" text NOT NULL,
	"ip_region" text NOT NULL,
	"user_agent" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shortener_data" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"qr_code_path" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"ip" text NOT NULL,
	"ip_region" text NOT NULL,
	"user_agent" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_data" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"fs_path" text NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"qr_code_path" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shortener_analytics" ADD CONSTRAINT "shortener_analytics_ref_id_shortener_data_id_fk" FOREIGN KEY ("ref_id") REFERENCES "public"."shortener_data"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortener_data" ADD CONSTRAINT "shortener_data_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortener_data" ADD CONSTRAINT "shortener_data_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_analytics" ADD CONSTRAINT "site_analytics_site_id_site_data_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site_data"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_data" ADD CONSTRAINT "site_data_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_data" ADD CONSTRAINT "site_data_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;