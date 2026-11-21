import { and, eq, gte, lte } from "drizzle-orm";
import {
  bucketStats,
  getDb,
  priceSnapshots,
} from "@ppa/db";
import {
  computeStats,
  dateOnly,
  tripBucket,
  type PricePoint,
} from "@ppa/core";
import { detectionConfig } from "./config";
import { chunk, logJob } from "./utils";

export type RefreshStatsOptions = {
  days?: number;
  asOf?: Date;
};

export type RefreshStatsResult = {
  asOf: string;
  buckets: number;
  snapshots: number;
  durationMs: number;
};

type Group = {
  routeId: string;
  departureMonth: string;
  tripBucket: string;
  points: PricePoint[];
};

export async function refreshBucketStats(
  options: RefreshStatsOptions = {},
): Promise<RefreshStatsResult> {
  const startedAt = Date.now();
  const db = await getDb();
  const asOf = options.asOf ?? new Date();
  const days = options.days ?? 90;
  const since = new Date(asOf.getTime() - days * 86_400_000);
  const asOfDate = dateOnly(asOf);

  const rows = await db
    .select({
      routeId: priceSnapshots.routeId,
      departureMonth: priceSnapshots.departureMonth,
      tripDays: priceSnapshots.tripDays,
      priceCents: priceSnapshots.priceCents,
      observedAt: priceSnapshots.observedAt,
    })
    .from(priceSnapshots)
    .where(
      and(
        gte(priceSnapshots.observedAt, since),
        lte(priceSnapshots.observedAt, asOf),
        gte(priceSnapshots.departureDate, asOfDate),
      ),
    );

  const groups = new Map<string, Group>();
  for (const row of rows) {
    const bucket = tripBucket(row.tripDays);
    const key = `${row.routeId}|${row.departureMonth}|${bucket}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        routeId: row.routeId,
        departureMonth: row.departureMonth,
        tripBucket: bucket,
        points: [],
      };
      groups.set(key, group);
    }
    group.points.push({
      priceCents: row.priceCents,
      observedAt: row.observedAt,
    });
  }

  const config = detectionConfig();
  const values: Array<typeof bucketStats.$inferInsert> = [];
  for (const group of groups.values()) {
    const stats = computeStats(group.points);
    if (!stats) continue;
    values.push({
      routeId: group.routeId,
      departureMonth: group.departureMonth,
      tripBucket: group.tripBucket,
      asOfDate,
      p01Cents: stats.p01Cents,
      p10Cents: stats.p10Cents,
      p25Cents: stats.p25Cents,
      p50Cents: stats.p50Cents,
      p90Cents: stats.p90Cents,
      minCents: stats.minCents,
      min2Cents: stats.min2Cents,
      maxCents: stats.maxCents,
      madCents: stats.madCents,
      sampleDays: stats.sampleDays,
      sampleCount: stats.sampleCount,
      version: config.version,
      computedAt: asOf,
    });
  }

  await db.delete(bucketStats).where(eq(bucketStats.asOfDate, asOfDate));
  for (const batch of chunk(values, 300)) {
    await db.insert(bucketStats).values(batch);
  }

  const result: RefreshStatsResult = {
    asOf: asOfDate,
    buckets: values.length,
    snapshots: rows.length,
    durationMs: Date.now() - startedAt,
  };
  logJob("stats", "estatísticas recalculadas", result);
  return result;
}
