import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  collectorRuns,
  getDb,
  priceSnapshots,
  routes,
  ROUTE_SEEDS,
} from "@ppa/db";
import {
  MockSource,
  TravelpayoutsSource,
  type PriceSource,
  type RawPrice,
} from "@ppa/sources";
import { priceSourceId, travelpayoutsConfig } from "./config";
import { chunk, logJob } from "./utils";

export type CollectOptions = {
  sourceId?: string;
  routeIds?: string[];
  limit?: number;
  now?: Date;
  source?: PriceSource;
  months?: number;
};

export type CollectResult = {
  runId: string;
  source: string;
  routes: number;
  requests: number;
  snapshots: number;
  errors: number;
  messages: string[];
  durationMs: number;
};

export function createPriceSource(sourceId = priceSourceId()): PriceSource {
  if (sourceId === "travelpayouts") {
    const config = travelpayoutsConfig();
    if (!config.token) {
      throw new Error(
        "TRAVELPAYOUTS_TOKEN não configurado. Use PRICE_SOURCE=mock para demonstração.",
      );
    }
    return new TravelpayoutsSource({
      token: config.token,
      marker: config.marker,
      baseUrl: config.baseUrl,
    });
  }

  if (sourceId === "mock") {
    return new MockSource(ROUTE_SEEDS);
  }

  throw new Error(`Fonte de preço desconhecida: ${sourceId}`);
}

function diffDays(from: string, to: string): number | null {
  const start = Date.parse(`${from}T12:00:00Z`);
  const end = Date.parse(`${to}T12:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const days = Math.round((end - start) / 86_400_000);
  return days > 0 ? days : null;
}

export function monthWindows(
  now: Date,
  count = 6,
): Array<{ from: string; to: string }> {
  const windows: Array<{ from: string; to: string }> = [];
  for (let index = 0; index < count; index += 1) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index + 1, 0),
    );
    windows.push({
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    });
  }
  return windows;
}

type SnapshotInsert = typeof priceSnapshots.$inferInsert;

function toSnapshot(
  routeId: string,
  raw: RawPrice,
  now: Date,
): SnapshotInsert | null {
  if (!raw.departureDate || raw.departureDate.length !== 10) return null;
  if (!Number.isFinite(raw.priceCents) || raw.priceCents <= 0) return null;

  return {
    routeId,
    source: raw.source,
    carrier: raw.carrier,
    departureDate: raw.departureDate,
    returnDate: raw.returnDate,
    tripDays: raw.returnDate
      ? diffDays(raw.departureDate, raw.returnDate)
      : null,
    departureMonth: `${raw.departureDate.slice(0, 7)}-01`,
    priceCents: Math.round(raw.priceCents),
    currency: raw.currency || "BRL",
    stops: raw.stops,
    returnStops: raw.returnStops,
    durationMinutes: raw.durationMinutes,
    bagsIncluded: raw.bagsIncluded,
    selfTransfer: raw.selfTransfer,
    deepLink: raw.deepLink,
    observedAt: now,
    raw: raw.raw ?? null,
  };
}

export async function collectPrices(
  options: CollectOptions = {},
): Promise<CollectResult> {
  const startedAt = Date.now();
  const db = await getDb();
  const source = options.source ?? createPriceSource(options.sourceId);
  const now = options.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const windows = monthWindows(now, options.months ?? 6);

  const [run] = await db
    .insert(collectorRuns)
    .values({ source: source.id, startedAt: now, status: "running" })
    .returning();

  let requests = 0;
  let errors = 0;
  let snapshotCount = 0;
  const messages: string[] = [];

  try {
    const conditions = [eq(routes.monitorEnabled, true)];
    if (options.routeIds?.length) {
      conditions.push(inArray(routes.id, options.routeIds));
    }

    let routeRows = await db
      .select()
      .from(routes)
      .where(and(...conditions))
      .orderBy(
        sql`${routes.lastCollectedAt} ASC NULLS FIRST`,
        asc(routes.priority),
      );

    if (options.limit && options.limit > 0) {
      routeRows = routeRows.slice(0, options.limit);
    }

    for (const route of routeRows) {
      for (const window of windows) {
        requests += 1;
        try {
          const results = await source.search({
            origin: route.origin,
            destination: route.destination,
            departureFrom: window.from,
            departureTo: window.to,
            currency: "BRL",
            limit: 30,
          });

          const unique = new Map<string, SnapshotInsert>();
          for (const raw of results) {
            if (raw.departureDate < today) continue;
            const snapshot = toSnapshot(route.id, raw, now);
            if (!snapshot) continue;
            const key = [
              snapshot.carrier ?? "",
              snapshot.departureDate,
              snapshot.returnDate ?? "",
              snapshot.priceCents,
              snapshot.stops,
            ].join("|");
            unique.set(key, snapshot);
          }

          const values = [...unique.values()];
          for (const batch of chunk(values, 400)) {
            await db.insert(priceSnapshots).values(batch);
          }
          snapshotCount += values.length;
        } catch (error) {
          errors += 1;
          const message =
            error instanceof Error ? error.message : String(error);
          messages.push(
            `${route.origin}-${route.destination} ${window.from.slice(0, 7)}: ${message}`,
          );
          if (errors >= 8) {
            throw new Error(
              `Coleta abortada após ${errors} falhas. Última: ${message}`,
            );
          }
        }
      }

      await db
        .update(routes)
        .set({ lastCollectedAt: new Date() })
        .where(eq(routes.id, route.id));
    }

    await db
      .update(collectorRuns)
      .set({
        finishedAt: new Date(),
        status: errors > 0 ? "partial" : "success",
        requests,
        errors,
        message: messages.slice(0, 6).join(" | ") || null,
      })
      .where(eq(collectorRuns.id, run.id));

    const result: CollectResult = {
      runId: run.id,
      source: source.id,
      routes: routeRows.length,
      requests,
      snapshots: snapshotCount,
      errors,
      messages,
      durationMs: Date.now() - startedAt,
    };
    logJob("collect", "coleta concluída", {
      source: result.source,
      routes: result.routes,
      snapshots: result.snapshots,
      errors: result.errors,
    });
    return result;
  } catch (error) {
    await db
      .update(collectorRuns)
      .set({
        finishedAt: new Date(),
        status: "failed",
        requests,
        errors,
        message: error instanceof Error ? error.message : String(error),
      })
      .where(eq(collectorRuns.id, run.id));
    throw error;
  }
}
