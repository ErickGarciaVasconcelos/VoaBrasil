import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type OfferStatus =
  | "draft"
  | "approved"
  | "published"
  | "rejected"
  | "expired";

export type DealLevelDb = "good" | "great" | "error";
export type SubscriberStatus = "pending" | "confirmed" | "unsubscribed";
export type NotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped";

export const airports = pgTable("airports", {
  iata: text("iata").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull().default("BR"),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  lat: real("lat"),
  lon: real("lon"),
});

export const routes = pgTable(
  "routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    origin: text("origin")
      .notNull()
      .references(() => airports.iata),
    destination: text("destination")
      .notNull()
      .references(() => airports.iata),
    monitorEnabled: boolean("monitor_enabled").notNull().default(true),
    priority: integer("priority").notNull().default(5),
    maxStops: integer("max_stops").notNull().default(2),
    maxDurationMinutes: integer("max_duration_minutes").notNull().default(2400),
    ceilingCents: integer("ceiling_cents"),
    lastCollectedAt: timestamp("last_collected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("routes_origin_destination_unique").on(
      table.origin,
      table.destination,
    ),
    index("routes_priority_idx").on(table.priority),
    index("routes_monitor_idx").on(table.monitorEnabled),
  ],
);

export const priceSnapshots = pgTable(
  "price_snapshots",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    carrier: text("carrier"),
    departureDate: date("departure_date", { mode: "string" }).notNull(),
    returnDate: date("return_date", { mode: "string" }),
    tripDays: integer("trip_days"),
    departureMonth: date("departure_month", { mode: "string" }).notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("BRL"),
    stops: integer("stops").notNull().default(0),
    returnStops: integer("return_stops"),
    durationMinutes: integer("duration_minutes"),
    bagsIncluded: boolean("bags_included"),
    selfTransfer: boolean("self_transfer").notNull().default(false),
    deepLink: text("deep_link"),
    observedAt: timestamp("observed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    raw: jsonb("raw"),
  },
  (table) => [
    index("snapshots_route_month_observed_idx").on(
      table.routeId,
      table.departureMonth,
      table.observedAt,
    ),
    index("snapshots_route_observed_idx").on(table.routeId, table.observedAt),
    index("snapshots_route_dates_idx").on(
      table.routeId,
      table.departureDate,
      table.returnDate,
    ),
    index("snapshots_observed_idx").on(table.observedAt),
  ],
);

export const bucketStats = pgTable(
  "bucket_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    departureMonth: date("departure_month", { mode: "string" }).notNull(),
    tripBucket: text("trip_bucket").notNull(),
    asOfDate: date("as_of_date", { mode: "string" }).notNull(),
    p01Cents: integer("p01_cents").notNull(),
    p10Cents: integer("p10_cents").notNull(),
    p25Cents: integer("p25_cents").notNull(),
    p50Cents: integer("p50_cents").notNull(),
    p90Cents: integer("p90_cents").notNull(),
    minCents: integer("min_cents").notNull(),
    min2Cents: integer("min2_cents").notNull(),
    maxCents: integer("max_cents").notNull(),
    madCents: integer("mad_cents").notNull(),
    sampleDays: integer("sample_days").notNull(),
    sampleCount: integer("sample_count").notNull(),
    version: integer("version").notNull().default(1),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("bucket_stats_unique_idx").on(
      table.routeId,
      table.departureMonth,
      table.tripBucket,
      table.asOfDate,
    ),
  ],
);

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    snapshotId: bigint("snapshot_id", { mode: "number" }).references(
      () => priceSnapshots.id,
      { onDelete: "set null" },
    ),
    source: text("source").notNull().default("manual"),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("BRL"),
    departureDate: date("departure_date", { mode: "string" }).notNull(),
    returnDate: date("return_date", { mode: "string" }),
    tripDays: integer("trip_days"),
    carrier: text("carrier"),
    stops: integer("stops").notNull().default(0),
    durationMinutes: integer("duration_minutes"),
    bagsIncluded: boolean("bags_included"),
    selfTransfer: boolean("self_transfer").notNull().default(false),
    deepLink: text("deep_link"),
    level: text("level").$type<DealLevelDb>().notNull(),
    score: real("score").notNull().default(0),
    reason: jsonb("reason").$type<Record<string, unknown>>(),
    status: text("status").$type<OfferStatus>().notNull().default("draft"),
    coldStart: boolean("cold_start").notNull().default(false),
    priceObservedAt: timestamp("price_observed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    telegramMessageId: text("telegram_message_id"),
    clickCount: integer("click_count").notNull().default(0),
    dedupHash: text("dedup_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("offers_status_published_idx").on(table.status, table.publishedAt),
    index("offers_route_status_idx").on(table.routeId, table.status),
    index("offers_level_idx").on(table.level),
  ],
);

export const offerEvents = pgTable(
  "offer_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    actor: text("actor"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("offer_events_offer_idx").on(table.offerId)],
);

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    status: text("status").$type<SubscriberStatus>().notNull().default("pending"),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    consentSource: text("consent_source"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("subscribers_status_idx").on(table.status)],
);

export const alertRules = pgTable(
  "alert_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    origin: text("origin"),
    destination: text("destination"),
    maxPriceCents: integer("max_price_cents"),
    departFrom: date("depart_from", { mode: "string" }),
    departTo: date("depart_to", { mode: "string" }),
    tripMinDays: integer("trip_min_days"),
    tripMaxDays: integer("trip_max_days"),
    channels: jsonb("channels")
      .$type<string[]>()
      .notNull()
      .default(sql`'["email"]'::jsonb`),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("alert_rules_subscriber_idx").on(table.subscriberId),
    index("alert_rules_active_idx").on(table.active),
    index("alert_rules_route_idx").on(table.origin, table.destination),
  ],
);

export const telegramSubscribers = pgTable(
  "telegram_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: text("chat_id").notNull().unique(),
    username: text("username"),
    subscriberId: uuid("subscriber_id").references(() => subscribers.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("telegram_subscribers_status_idx").on(table.status)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    subscriberId: uuid("subscriber_id").references(() => subscribers.id, {
      onDelete: "set null",
    }),
    channel: text("channel").notNull(),
    recipient: text("recipient").notNull(),
    status: text("status")
      .$type<NotificationStatus>()
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    error: text("error"),
    dedupeKey: text("dedupe_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_status_schedule_idx").on(
      table.status,
      table.scheduledFor,
    ),
    index("notifications_offer_idx").on(table.offerId),
  ],
);

export const clicks = pgTable(
  "clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().default("site"),
    ipHash: text("ip_hash"),
    uaHash: text("ua_hash"),
    referrer: text("referrer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("clicks_offer_created_idx").on(table.offerId, table.createdAt),
    index("clicks_created_idx").on(table.createdAt),
  ],
);

export const conversions = pgTable(
  "conversions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clickId: uuid("click_id").references(() => clicks.id, {
      onDelete: "set null",
    }),
    offerId: uuid("offer_id").references(() => offers.id, {
      onDelete: "set null",
    }),
    commissionCents: integer("commission_cents").notNull().default(0),
    status: text("status").notNull().default("pending"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    raw: jsonb("raw"),
  },
  (table) => [index("conversions_offer_idx").on(table.offerId)],
);

export const collectorRuns = pgTable(
  "collector_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").notNull().default("running"),
    requests: integer("requests").notNull().default(0),
    errors: integer("errors").notNull().default(0),
    message: text("message"),
  },
  (table) => [index("collector_runs_started_idx").on(table.startedAt)],
);

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    job: text("job").notNull(),
    status: text("status").notNull().default("running"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    details: jsonb("details").$type<Record<string, unknown>>(),
    error: text("error"),
  },
  (table) => [index("job_runs_job_idx").on(table.job, table.startedAt)],
);
