import { eq, sql } from "drizzle-orm";
import {
  AIRPORTS,
  DEMO_HIGHLIGHT_ROUTES,
  ROUTE_SEEDS,
  airports,
  bucketStats,
  clicks,
  getDb,
  notifications,
  offers,
  priceSnapshots,
  routes,
  runMigrations,
} from "@ppa/db";
import { dateOnly } from "@ppa/core";
import { aviasalesSearchUrl, mockPriceCents } from "@ppa/sources";
import { refreshBucketStats } from "./stats";
import { detectDeals } from "./detect";
import { publishOffer } from "./publish";
import { dispatchNotifications } from "./notify";
import { travelpayoutsConfig } from "./config";
import { chunk, logJob } from "./utils";

export type SeedDemoOptions = {
  reset?: boolean;
  now?: Date;
  days?: number;
};

export type SeedDemoResult = {
  skipped: boolean;
  reason?: string;
  airports: number;
  routes: number;
  snapshots: number;
  buckets: number;
  detected: number;
  published: number;
  notifications: number;
};

type SnapshotInsert = typeof priceSnapshots.$inferInsert;

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function demoLink(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
): string {
  return aviasalesSearchUrl(
    origin,
    destination,
    departureDate,
    returnDate,
    { marker: travelpayoutsConfig().marker },
  );
}

/**
 * Popula o banco com 75 dias de histórico sintético e roda o pipeline real
 * (estatísticas → detecção → publicação). Serve para validar o produto antes
 * de conectar uma API paga.
 */
export async function seedDemo(
  options: SeedDemoOptions = {},
): Promise<SeedDemoResult> {
  const db = await getDb();
  const now = options.now ?? new Date();
  const days = options.days ?? 75;
  const reset = options.reset ?? false;

  await runMigrations();

  await db.insert(airports).values(AIRPORTS).onConflictDoNothing();

  for (const batch of chunk(
    ROUTE_SEEDS.map((route) => ({
      origin: route.origin,
      destination: route.destination,
      priority: route.priority,
      maxStops: route.maxStops,
      maxDurationMinutes: route.maxDurationMinutes,
      ceilingCents: route.ceilingCents,
    })),
    100,
  )) {
    await db.insert(routes).values(batch).onConflictDoNothing();
  }

  if (reset) {
    await db.delete(clicks);
    await db.delete(notifications);
    await db.delete(offers);
    await db.delete(bucketStats);
    await db.delete(priceSnapshots);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(priceSnapshots);

  if (count > 0 && !reset) {
    logJob("demo", "dados já existem; demonstração não foi recriada", {
      snapshots: count,
    });
    return {
      skipped: true,
      reason: "snapshots_exist",
      airports: AIRPORTS.length,
      routes: ROUTE_SEEDS.length,
      snapshots: count,
      buckets: 0,
      detected: 0,
      published: 0,
      notifications: 0,
    };
  }

  const routeRows = await db.select().from(routes);
  const seedByRoute = new Map(
    ROUTE_SEEDS.map((route) => [
      `${route.origin}-${route.destination}`,
      route,
    ]),
  );

  const values: SnapshotInsert[] = [];
  const nowKey = dateOnly(now);

  for (const route of routeRows) {
    const seed = seedByRoute.get(`${route.origin}-${route.destination}`);
    if (!seed) continue;

    for (let offset = days; offset >= 0; offset -= 1) {
      const observedAt = new Date(now.getTime() - offset * 86_400_000);
      for (const advance of [21, 45, 75]) {
        const departureDate = dateOnly(
          new Date(now.getTime() + advance * 86_400_000),
        );
        const returnDate = addDays(departureDate, seed.baseTripDays);
        values.push({
          routeId: route.id,
          source: "mock",
          carrier: seed.carrier,
          departureDate,
          returnDate,
          tripDays: seed.baseTripDays,
          departureMonth: `${departureDate.slice(0, 7)}-01`,
          priceCents: mockPriceCents(seed, departureDate, observedAt),
          currency: "BRL",
          stops: seed.stops,
          returnStops: seed.stops,
          durationMinutes: seed.durationMinutes,
          bagsIncluded: offset % 3 !== 0,
          selfTransfer: false,
          deepLink: demoLink(
            route.origin,
            route.destination,
            departureDate,
            returnDate,
          ),
          observedAt,
          raw: { demo: true },
        });
      }
    }

    if (DEMO_HIGHLIGHT_ROUTES.includes(`${route.origin}-${route.destination}`)) {
      const departureDate = dateOnly(
        new Date(now.getTime() + 35 * 86_400_000),
      );
      const returnDate = addDays(departureDate, seed.baseTripDays);
      values.push({
        routeId: route.id,
        source: "mock",
        carrier: seed.carrier,
        departureDate,
        returnDate,
        tripDays: seed.baseTripDays,
        departureMonth: `${departureDate.slice(0, 7)}-01`,
        priceCents: Math.round((seed.basePriceCents * 0.55) / 100) * 100,
        currency: "BRL",
        stops: seed.stops,
        returnStops: seed.stops,
        durationMinutes: seed.durationMinutes,
        bagsIncluded: false,
        selfTransfer: false,
        deepLink: demoLink(
          route.origin,
          route.destination,
          departureDate,
          returnDate,
        ),
        observedAt: now,
        raw: { demo: true, highlight: true, nowKey },
      });
    }
  }

  for (const batch of chunk(values, 500)) {
    await db.insert(priceSnapshots).values(batch);
  }

  const stats = await refreshBucketStats({ asOf: now, days: 90 });
  const detection = await detectDeals({
    now,
    autoPublish: false,
    maxOffers: 60,
  });

  const drafts = await db
    .select({ id: offers.id })
    .from(offers)
    .where(eq(offers.status, "draft"));

  let published = 0;
  for (const draft of drafts) {
    await publishOffer(draft.id, "demo");
    published += 1;
  }

  const dispatch = await dispatchNotifications({ now, limit: 100 });

  const result: SeedDemoResult = {
    skipped: false,
    airports: AIRPORTS.length,
    routes: routeRows.length,
    snapshots: values.length,
    buckets: stats.buckets,
    detected: detection.created + detection.updated,
    published,
    notifications: dispatch.processed,
  };
  logJob("demo", "demonstração criada", result);
  return result;
}

export async function resetDemo(
  options: Omit<SeedDemoOptions, "reset"> = {},
): Promise<SeedDemoResult> {
  return seedDemo({ ...options, reset: true });
}
