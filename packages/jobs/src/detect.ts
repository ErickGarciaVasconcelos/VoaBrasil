import { createHash } from "node:crypto";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import {
  airports,
  bucketStats,
  getDb,
  offers,
  priceSnapshots,
  routes,
  type OfferStatus,
} from "@ppa/db";
import {
  checkQuality,
  classifyDeal,
  coldStartDeal,
  dateOnly,
  offerSlug,
  tripBucket,
  type BucketStats,
  type DealClassification,
} from "@ppa/core";
import { detectionConfig, TTL_HOURS } from "./config";
import { publishOffer } from "./publish";
import { logJob } from "./utils";

export type DetectOptions = {
  now?: Date;
  autoPublish?: boolean;
  maxOffers?: number;
};

export type DetectResult = {
  asOf: string;
  candidates: number;
  itineraries: number;
  created: number;
  updated: number;
  published: number;
  skipped: number;
  durationMs: number;
};

type Candidate = {
  id: number;
  routeId: string;
  source: string;
  carrier: string | null;
  departureDate: string;
  returnDate: string | null;
  tripDays: number | null;
  departureMonth: string;
  priceCents: number;
  currency: string;
  stops: number;
  durationMinutes: number | null;
  bagsIncluded: boolean | null;
  selfTransfer: boolean;
  deepLink: string | null;
  observedAt: Date;
};

function toCoreStats(row: typeof bucketStats.$inferSelect): BucketStats {
  return {
    p01Cents: row.p01Cents,
    p10Cents: row.p10Cents,
    p25Cents: row.p25Cents,
    p50Cents: row.p50Cents,
    p90Cents: row.p90Cents,
    minCents: row.minCents,
    min2Cents: row.min2Cents,
    maxCents: row.maxCents,
    madCents: row.madCents,
    sampleDays: row.sampleDays,
    sampleCount: row.sampleCount,
  };
}

export async function detectDeals(
  options: DetectOptions = {},
): Promise<DetectResult> {
  const startedAt = Date.now();
  const db = await getDb();
  const now = options.now ?? new Date();
  const today = dateOnly(now);
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const config = detectionConfig();

  const [latestStats] = await db
    .select({ asOfDate: bucketStats.asOfDate })
    .from(bucketStats)
    .orderBy(desc(bucketStats.asOfDate))
    .limit(1);

  const statsRows = latestStats
    ? await db
        .select()
        .from(bucketStats)
        .where(eq(bucketStats.asOfDate, latestStats.asOfDate))
    : [];

  const statsMap = new Map<string, BucketStats>();
  for (const row of statsRows) {
    statsMap.set(
      `${row.routeId}|${row.departureMonth}|${row.tripBucket}`,
      toCoreStats(row),
    );
  }

  const routeRows = await db
    .select()
    .from(routes)
    .where(eq(routes.monitorEnabled, true));
  const routeMap = new Map(routeRows.map((route) => [route.id, route]));

  const airportRows = await db.select().from(airports);
  const airportMap = new Map(
    airportRows.map((airport) => [airport.iata, airport]),
  );

  const candidateRows = await db
    .select({
      id: priceSnapshots.id,
      routeId: priceSnapshots.routeId,
      source: priceSnapshots.source,
      carrier: priceSnapshots.carrier,
      departureDate: priceSnapshots.departureDate,
      returnDate: priceSnapshots.returnDate,
      tripDays: priceSnapshots.tripDays,
      departureMonth: priceSnapshots.departureMonth,
      priceCents: priceSnapshots.priceCents,
      currency: priceSnapshots.currency,
      stops: priceSnapshots.stops,
      durationMinutes: priceSnapshots.durationMinutes,
      bagsIncluded: priceSnapshots.bagsIncluded,
      selfTransfer: priceSnapshots.selfTransfer,
      deepLink: priceSnapshots.deepLink,
      observedAt: priceSnapshots.observedAt,
    })
    .from(priceSnapshots)
    .innerJoin(routes, eq(priceSnapshots.routeId, routes.id))
    .where(
      and(
        gte(priceSnapshots.observedAt, since),
        gte(priceSnapshots.departureDate, today),
        eq(routes.monitorEnabled, true),
      ),
    )
    .orderBy(asc(priceSnapshots.priceCents));

  const groups = new Map<string, Candidate[]>();
  for (const row of candidateRows) {
    const key = [
      row.routeId,
      row.departureDate,
      row.returnDate ?? "",
      row.carrier ?? "",
    ].join("|");
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  let created = 0;
  let updated = 0;
  let published = 0;
  let skipped = 0;
  const maxOffers = options.maxOffers ?? 40;

  for (const group of groups.values()) {
    if (created + updated >= maxOffers) break;

    const best = group[0];
    const route = routeMap.get(best.routeId);
    if (!route) {
      skipped += 1;
      continue;
    }

    const stats = statsMap.get(
      `${best.routeId}|${best.departureMonth}|${tripBucket(best.tripDays)}`,
    );
    const confirmations = new Set(
      group.map(
        (item) =>
          `${item.source}|${item.observedAt.toISOString().slice(0, 13)}`,
      ),
    ).size;

    const classification: DealClassification | null = stats
      ? classifyDeal(best.priceCents, stats, config, {
          ceilingCents: route.ceilingCents,
          confirmations,
        })
      : coldStartDeal(best.priceCents, route.ceilingCents, config);

    if (!classification) {
      skipped += 1;
      continue;
    }

    const quality = checkQuality(
      {
        priceCents: best.priceCents,
        stops: best.stops,
        durationMinutes: best.durationMinutes,
        selfTransfer: best.selfTransfer,
        bagsIncluded: best.bagsIncluded,
        departureHour: null,
      },
      {
        maxStops: route.maxStops,
        maxDurationMinutes: route.maxDurationMinutes,
        minPriceCents: config.minPriceCents,
      },
    );
    if (!quality.ok) {
      skipped += 1;
      continue;
    }

    const dedupHash = createHash("sha256")
      .update(
        [
          best.routeId,
          best.departureDate,
          best.returnDate ?? "",
          best.carrier ?? "",
        ].join("|"),
      )
      .digest("hex")
      .slice(0, 32);

    const origin = airportMap.get(route.origin);
    const destination = airportMap.get(route.destination);
    const title = origin && destination
      ? `${origin.city} → ${destination.city}`
      : `${route.origin} → ${route.destination}`;

    const reason = {
      ...classification.reason,
      flags: quality.flags,
    };

    const [existing] = await db
      .select()
      .from(offers)
      .where(eq(offers.dedupHash, dedupHash))
      .limit(1);

    const offerValues = {
      routeId: best.routeId,
      snapshotId: best.id,
      source: best.source,
      title,
      priceCents: best.priceCents,
      currency: best.currency,
      departureDate: best.departureDate,
      returnDate: best.returnDate,
      tripDays: best.tripDays,
      carrier: best.carrier,
      stops: best.stops,
      durationMinutes: best.durationMinutes,
      bagsIncluded: best.bagsIncluded,
      selfTransfer: best.selfTransfer,
      deepLink: best.deepLink,
      level: classification.level,
      score: classification.score,
      reason,
      coldStart: Boolean(classification.reason.coldStart),
      priceObservedAt: best.observedAt,
      expiresAt: new Date(
        now.getTime() + TTL_HOURS[classification.level] * 3_600_000,
      ),
      updatedAt: now,
    };

    if (existing) {
      // Rejeição manual é definitiva até o administrador reabrir a oferta.
      if (existing.status === "rejected") {
        skipped += 1;
        continue;
      }

      if (existing.priceCents <= best.priceCents * 0.98) {
        skipped += 1;
        continue;
      }

      const keepPublished =
        existing.status === "published" && classification.level !== "error";
      const nextStatus: OfferStatus = keepPublished ? "published" : "draft";

      await db
        .update(offers)
        .set({
          ...offerValues,
          status: nextStatus,
          ...(keepPublished
            ? {}
            : {
                publishedAt: null,
                expiresAt: null,
                telegramMessageId: null,
              }),
        })
        .where(eq(offers.id, existing.id));
      updated += 1;

      if (
        options.autoPublish &&
        nextStatus !== "published" &&
        classification.level !== "error"
      ) {
        await publishOffer(existing.id, "auto");
        published += 1;
      }
      continue;
    }

    const slug = offerSlug({
      origin: route.origin,
      destination: route.destination,
      departureDate: best.departureDate,
      carrier: best.carrier,
      hash: dedupHash,
    });

    const [inserted] = await db
      .insert(offers)
      .values({
        ...offerValues,
        slug,
        dedupHash,
        status: "draft",
      })
      .returning({ id: offers.id });
    created += 1;

    if (options.autoPublish && classification.level !== "error") {
      await publishOffer(inserted.id, "auto");
      published += 1;
    }
  }

  const result: DetectResult = {
    asOf: latestStats?.asOfDate ?? today,
    candidates: candidateRows.length,
    itineraries: groups.size,
    created,
    updated,
    published,
    skipped,
    durationMs: Date.now() - startedAt,
  };
  logJob("detect", "detecção concluída", {
    created: result.created,
    updated: result.updated,
    published: result.published,
    skipped: result.skipped,
  });
  return result;
}
