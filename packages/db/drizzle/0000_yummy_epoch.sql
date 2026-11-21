CREATE TABLE "airports" (
	"iata" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"state" text,
	"country" text DEFAULT 'BR' NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"lat" real,
	"lon" real
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"origin" text,
	"destination" text,
	"max_price_cents" integer,
	"depart_from" date,
	"depart_to" date,
	"trip_min_days" integer,
	"trip_max_days" integer,
	"channels" jsonb DEFAULT '["email"]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bucket_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"departure_month" date NOT NULL,
	"trip_bucket" text NOT NULL,
	"as_of_date" date NOT NULL,
	"p01_cents" integer NOT NULL,
	"p10_cents" integer NOT NULL,
	"p25_cents" integer NOT NULL,
	"p50_cents" integer NOT NULL,
	"p90_cents" integer NOT NULL,
	"min_cents" integer NOT NULL,
	"min2_cents" integer NOT NULL,
	"max_cents" integer NOT NULL,
	"mad_cents" integer NOT NULL,
	"sample_days" integer NOT NULL,
	"sample_count" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"channel" text DEFAULT 'site' NOT NULL,
	"ip_hash" text,
	"ua_hash" text,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collector_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"message" text
);
--> statement-breakpoint
CREATE TABLE "conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"click_id" uuid,
	"offer_id" uuid,
	"commission_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"details" jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"subscriber_id" uuid,
	"channel" text NOT NULL,
	"recipient" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"scheduled_for" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"error" text,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "offer_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"type" text NOT NULL,
	"actor" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"snapshot_id" bigint,
	"source" text DEFAULT 'manual' NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"departure_date" date NOT NULL,
	"return_date" date,
	"trip_days" integer,
	"carrier" text,
	"stops" integer DEFAULT 0 NOT NULL,
	"duration_minutes" integer,
	"bags_included" boolean,
	"self_transfer" boolean DEFAULT false NOT NULL,
	"deep_link" text,
	"level" text NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"reason" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"cold_start" boolean DEFAULT false NOT NULL,
	"price_observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"telegram_message_id" text,
	"click_count" integer DEFAULT 0 NOT NULL,
	"dedup_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "offers_dedup_hash_unique" UNIQUE("dedup_hash")
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"route_id" uuid NOT NULL,
	"source" text NOT NULL,
	"carrier" text,
	"departure_date" date NOT NULL,
	"return_date" date,
	"trip_days" integer,
	"departure_month" date NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"stops" integer DEFAULT 0 NOT NULL,
	"return_stops" integer,
	"duration_minutes" integer,
	"bags_included" boolean,
	"self_transfer" boolean DEFAULT false NOT NULL,
	"deep_link" text,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"monitor_enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"max_stops" integer DEFAULT 2 NOT NULL,
	"max_duration_minutes" integer DEFAULT 2400 NOT NULL,
	"ceiling_cents" integer,
	"last_collected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"consent_at" timestamp with time zone,
	"consent_source" text,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "telegram_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" text NOT NULL,
	"username" text,
	"subscriber_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_subscribers_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_stats" ADD CONSTRAINT "bucket_stats_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_click_id_clicks_id_fk" FOREIGN KEY ("click_id") REFERENCES "public"."clicks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_events" ADD CONSTRAINT "offer_events_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_snapshot_id_price_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."price_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_origin_airports_iata_fk" FOREIGN KEY ("origin") REFERENCES "public"."airports"("iata") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_destination_airports_iata_fk" FOREIGN KEY ("destination") REFERENCES "public"."airports"("iata") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_subscribers" ADD CONSTRAINT "telegram_subscribers_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_rules_subscriber_idx" ON "alert_rules" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "alert_rules_active_idx" ON "alert_rules" USING btree ("active");--> statement-breakpoint
CREATE INDEX "alert_rules_route_idx" ON "alert_rules" USING btree ("origin","destination");--> statement-breakpoint
CREATE UNIQUE INDEX "bucket_stats_unique_idx" ON "bucket_stats" USING btree ("route_id","departure_month","trip_bucket","as_of_date");--> statement-breakpoint
CREATE INDEX "clicks_offer_created_idx" ON "clicks" USING btree ("offer_id","created_at");--> statement-breakpoint
CREATE INDEX "clicks_created_idx" ON "clicks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "collector_runs_started_idx" ON "collector_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "conversions_offer_idx" ON "conversions" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "job_runs_job_idx" ON "job_runs" USING btree ("job","started_at");--> statement-breakpoint
CREATE INDEX "notifications_status_schedule_idx" ON "notifications" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "notifications_offer_idx" ON "notifications" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "offer_events_offer_idx" ON "offer_events" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "offers_status_published_idx" ON "offers" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "offers_route_status_idx" ON "offers" USING btree ("route_id","status");--> statement-breakpoint
CREATE INDEX "offers_level_idx" ON "offers" USING btree ("level");--> statement-breakpoint
CREATE INDEX "snapshots_route_month_observed_idx" ON "price_snapshots" USING btree ("route_id","departure_month","observed_at");--> statement-breakpoint
CREATE INDEX "snapshots_route_observed_idx" ON "price_snapshots" USING btree ("route_id","observed_at");--> statement-breakpoint
CREATE INDEX "snapshots_route_dates_idx" ON "price_snapshots" USING btree ("route_id","departure_date","return_date");--> statement-breakpoint
CREATE INDEX "snapshots_observed_idx" ON "price_snapshots" USING btree ("observed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "routes_origin_destination_unique" ON "routes" USING btree ("origin","destination");--> statement-breakpoint
CREATE INDEX "routes_priority_idx" ON "routes" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "routes_monitor_idx" ON "routes" USING btree ("monitor_enabled");--> statement-breakpoint
CREATE INDEX "subscribers_status_idx" ON "subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "telegram_subscribers_status_idx" ON "telegram_subscribers" USING btree ("status");