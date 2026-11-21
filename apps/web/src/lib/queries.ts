import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  airports,
  bucketStats,
  clicks,
  collectorRuns,
  getDb,
  notifications,
  offerEvents,
  offers,
  priceSnapshots,
  routes,
  subscribers,
} from "@ppa/db";
import type { DealLevel } from "@ppa/core";
import type {
  AdminOfferDetail,
  AdminOfferView,
  AdminStats,
  AirportView,
  HistoryPoint,
  OfferView,
  RoutePriceStats,
  RouteView,
} from "./types";

const originAirport = alias(airports, "origin_airport");
const destinationAirport = alias(airports, "destination_airport");

const offerSelection = {
  id: offers.id,
  routeId: offers.routeId,
  slug: offers.slug,
  title: offers.title,
  priceCents: offers.priceCents,
  currency: offers.currency,
  level: offers.level,
  score: offers.score,
  departureDate: offers.departureDate,
  returnDate: offers.returnDate,
  tripDays: offers.tripDays,
  carrier: offers.carrier,
  stops: offers.stops,
  durationMinutes: offers.durationMinutes,
  bagsIncluded: offers.bagsIncluded,
  selfTransfer: offers.selfTransfer,
  priceObservedAt: offers.priceObservedAt,
  publishedAt: offers.publishedAt,
  expiresAt: offers.expiresAt,
  coldStart: offers.coldStart,
  clickCount: offers.clickCount,
  reason: offers.reason,
  originIata: originAirport.iata,
  originCity: originAirport.city,
  originName: originAirport.name,
  originState: originAirport.state,
  originCountry: originAirport.country,
  destinationIata: destinationAirport.iata,
  destinationCity: destinationAirport.city,
  destinationName: destinationAirport.name,
  destinationState: destinationAirport.state,
  destinationCountry: destinationAirport.country,
} as const;

type OfferRow = {
  id: string;
  routeId: string;
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  level: DealLevel;
  score: number;
  departureDate: string;
  returnDate: string | null;
  tripDays: number | null;
  carrier: string | null;
  stops: number;
  durationMinutes: number | null;
  bagsIncluded: boolean | null;
  selfTransfer: boolean;
  priceObservedAt: Date;
  publishedAt: Date | null;
  expiresAt: Date | null;
  coldStart: boolean;
  clickCount: number;
  reason: Record<string, unknown> | null;
  originIata: string;
  originCity: string;
  originName: string;
  originState: string | null;
  originCountry: string;
  destinationIata: string;
  destinationCity: string;
  destinationName: string;
  destinationState: string | null;
  destinationCountry: string;
};

function airportView(input: {
  iata: string;
  city: string;
  name: string;
  state: string | null;
  country: string;
}): AirportView {
  return {
    iata: input.iata,
    city: input.city,
    name: input.name,
    state: input.state,
    country: input.country,
  };
}

function mapOffer(row: OfferRow): OfferView {
  return {
    id: row.id,
    routeId: row.routeId,
    slug: row.slug,
    title: row.title,
    priceCents: row.priceCents,
    currency: row.currency,
    level: row.level,
    score: row.score,
    departureDate: row.departureDate,
    returnDate: row.returnDate,
    tripDays: row.tripDays,
    carrier: row.carrier,
    stops: row.stops,
    durationMinutes: row.durationMinutes,
    bagsIncluded: row.bagsIncluded,
    selfTransfer: row.selfTransfer,
    priceObservedAt: row.priceObservedAt,
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt,
    coldStart: row.coldStart,
    clickCount: row.clickCount,
    medianCents:
      typeof row.reason?.p50Cents === "number" ? row.reason.p50Cents : null,
    origin: airportView({
      iata: row.originIata,
      city: row.originCity,
      name: row.originName,
      state: row.originState,
      country: row.originCountry,
    }),
    destination: airportView({
      iata: row.destinationIata,
      city: row.destinationCity,
      name: row.destinationName,
      state: row.destinationState,
      country: row.destinationCountry,
    }),
  };
}

function publishedCondition(now: Date) {
  return and(
    eq(offers.status, "published"),
    or(isNull(offers.expiresAt), gte(offers.expiresAt, now))!,
  );
}

async function offerBase() {
  const db = await getDb();
  const query = db
    .select(offerSelection)
    .from(offers)
    .innerJoin(routes, eq(offers.routeId, routes.id))
    .innerJoin(originAirport, eq(routes.origin, originAirport.iata))
    .innerJoin(
      destinationAirport,
      eq(routes.destination, destinationAirport.iata),
    );
  return { query };
}

export async function getPublishedOffers(
  options: {
    limit?: number;
    origin?: string;
    destination?: string;
    level?: DealLevel;
    routeId?: string;
  } = {},
): Promise<OfferView[]> {
  const now = new Date();
  const conditions = [publishedCondition(now)!];
  if (options.origin) conditions.push(eq(routes.origin, options.origin));
  if (options.destination) {
    conditions.push(eq(routes.destination, options.destination));
  }
  if (options.level) conditions.push(eq(offers.level, options.level));
  if (options.routeId) conditions.push(eq(offers.routeId, options.routeId));

  const rows = await (await offerBase())
    .query.where(and(...conditions))
    .orderBy(desc(offers.score), asc(offers.priceCents))
    .limit(options.limit ?? 12);

  return rows.map(mapOffer);
}

export async function getOfferBySlug(
  slug: string,
): Promise<OfferView | null> {
  const now = new Date();
  const [row] = await (await offerBase())
    .query.where(and(eq(offers.slug, slug), publishedCondition(now)!))
    .limit(1);
  return row ? mapOffer(row) : null;
}

export async function getRelatedOffers(
  routeId: string,
  excludeId: string,
  limit = 3,
): Promise<OfferView[]> {
  const now = new Date();
  const rows = await (await offerBase())
    .query.where(
      and(
        eq(offers.routeId, routeId),
        ne(offers.id, excludeId),
        publishedCondition(now)!,
      ),
    )
    .orderBy(desc(offers.score))
    .limit(limit);
  return rows.map(mapOffer);
}

export async function getRoute(
  origin: string,
  destination: string,
): Promise<RouteView | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      route: routes,
      origin: originAirport,
      destination: destinationAirport,
    })
    .from(routes)
    .innerJoin(originAirport, eq(routes.origin, originAirport.iata))
    .innerJoin(
      destinationAirport,
      eq(routes.destination, destinationAirport.iata),
    )
    .where(
      and(eq(routes.origin, origin), eq(routes.destination, destination)),
    )
    .limit(1);

  if (!row) return null;

  const now = new Date();
  const [aggregate] = await db
    .select({
      best: sql<number>`min(${offers.priceCents})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(offers)
    .where(
      and(eq(offers.routeId, row.route.id), publishedCondition(now)!),
    );

  return {
    id: row.route.id,
    origin: airportView(row.origin),
    destination: airportView(row.destination),
    monitorEnabled: row.route.monitorEnabled,
    priority: row.route.priority,
    maxStops: row.route.maxStops,
    maxDurationMinutes: row.route.maxDurationMinutes,
    ceilingCents: row.route.ceilingCents,
    lastCollectedAt: row.route.lastCollectedAt,
    bestPriceCents: aggregate?.best != null ? Number(aggregate.best) : null,
    offerCount: Number(aggregate?.count ?? 0),
  };
}

export async function getRoutesWithBestPrice(): Promise<RouteView[]> {
  const db = await getDb();
  const routeRows = await db
    .select({
      route: routes,
      origin: originAirport,
      destination: destinationAirport,
    })
    .from(routes)
    .innerJoin(originAirport, eq(routes.origin, originAirport.iata))
    .innerJoin(
      destinationAirport,
      eq(routes.destination, destinationAirport.iata),
    )
    .where(eq(routes.monitorEnabled, true))
    .orderBy(asc(originAirport.city), asc(destinationAirport.city));

  const now = new Date();
  const offerRows = await db
    .select({ routeId: offers.routeId, priceCents: offers.priceCents })
    .from(offers)
    .where(publishedCondition(now));

  const aggregates = new Map<string, { best: number; count: number }>();
  for (const offer of offerRows) {
    const current = aggregates.get(offer.routeId);
    if (!current) {
      aggregates.set(offer.routeId, {
        best: offer.priceCents,
        count: 1,
      });
    } else {
      current.best = Math.min(current.best, offer.priceCents);
      current.count += 1;
    }
  }

  return routeRows.map((row) => {
    const aggregate = aggregates.get(row.route.id);
    return {
      id: row.route.id,
      origin: airportView(row.origin),
      destination: airportView(row.destination),
      monitorEnabled: row.route.monitorEnabled,
      priority: row.route.priority,
      maxStops: row.route.maxStops,
      maxDurationMinutes: row.route.maxDurationMinutes,
      ceilingCents: row.route.ceilingCents,
      lastCollectedAt: row.route.lastCollectedAt,
      bestPriceCents: aggregate?.best ?? null,
      offerCount: aggregate?.count ?? 0,
    };
  });
}

export async function getAirports(): Promise<AirportView[]> {
  const db = await getDb();
  const rows = await db.select().from(airports).orderBy(asc(airports.city));
  return rows.map(airportView);
}

export async function getRouteHistory(
  routeId: string,
  days = 60,
): Promise<HistoryPoint[]> {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86_400_000);
  const dayExpression = sql<string>`to_char(${priceSnapshots.observedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
  const priceExpression = sql<number>`min(${priceSnapshots.priceCents})::int`;

  const rows = await db
    .select({
      day: dayExpression,
      priceCents: priceExpression,
    })
    .from(priceSnapshots)
    .where(
      and(
        eq(priceSnapshots.routeId, routeId),
        gte(priceSnapshots.observedAt, since),
      ),
    )
    .groupBy(dayExpression)
    .orderBy(dayExpression);

  return rows.map((row) => ({
    day: String(row.day),
    priceCents: Number(row.priceCents),
  }));
}

export async function getRoutePriceStats(
  routeId: string,
): Promise<RoutePriceStats | null> {
  const db = await getDb();
  const [latest] = await db
    .select({ asOfDate: bucketStats.asOfDate })
    .from(bucketStats)
    .where(eq(bucketStats.routeId, routeId))
    .orderBy(desc(bucketStats.asOfDate))
    .limit(1);

  if (!latest) return null;

  const rows = await db
    .select()
    .from(bucketStats)
    .where(
      and(
        eq(bucketStats.routeId, routeId),
        eq(bucketStats.asOfDate, latest.asOfDate),
      ),
    );

  if (rows.length === 0) return null;

  return {
    asOf: latest.asOfDate,
    medianCents: Math.min(...rows.map((row) => row.p50Cents)),
    minCents: Math.min(...rows.map((row) => row.minCents)),
    sampleDays: Math.max(...rows.map((row) => row.sampleDays)),
    sampleCount: rows.reduce((sum, row) => sum + row.sampleCount, 0),
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = await getDb();
  const since = new Date(Date.now() - 86_400_000);

  const [published] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(offers)
    .where(eq(offers.status, "published"));
  const [drafts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(offers)
    .where(eq(offers.status, "draft"));
  const [clickCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clicks)
    .where(gte(clicks.createdAt, since));
  const [subscriberCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscribers)
    .where(eq(subscribers.status, "confirmed"));
  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(eq(notifications.status, "pending"));

  const [lastRun] = await db
    .select()
    .from(collectorRuns)
    .orderBy(desc(collectorRuns.startedAt))
    .limit(1);

  return {
    published: Number(published?.count ?? 0),
    drafts: Number(drafts?.count ?? 0),
    clicks24h: Number(clickCount?.count ?? 0),
    subscribers: Number(subscriberCount?.count ?? 0),
    pendingNotifications: Number(pending?.count ?? 0),
    lastRun: lastRun
      ? {
          source: lastRun.source,
          status: lastRun.status,
          startedAt: lastRun.startedAt,
          finishedAt: lastRun.finishedAt,
          errors: lastRun.errors,
          message: lastRun.message,
        }
      : null,
  };
}

export async function getAdminOffers(
  options: { status?: string; limit?: number } = {},
): Promise<AdminOfferView[]> {
  const db = await getDb();
  const where = options.status ? eq(offers.status, options.status as never) : undefined;
  const rows = await db
    .select({
      id: offers.id,
      slug: offers.slug,
      title: offers.title,
      priceCents: offers.priceCents,
      level: offers.level,
      status: offers.status,
      originIata: originAirport.iata,
      destinationIata: destinationAirport.iata,
      departureDate: offers.departureDate,
      returnDate: offers.returnDate,
      carrier: offers.carrier,
      createdAt: offers.createdAt,
      publishedAt: offers.publishedAt,
      clickCount: offers.clickCount,
      coldStart: offers.coldStart,
    })
    .from(offers)
    .innerJoin(routes, eq(offers.routeId, routes.id))
    .innerJoin(originAirport, eq(routes.origin, originAirport.iata))
    .innerJoin(
      destinationAirport,
      eq(routes.destination, destinationAirport.iata),
    )
    .where(where)
    .orderBy(desc(offers.createdAt))
    .limit(options.limit ?? 100);

  return rows.map((row) => ({
    ...row,
    level: row.level as DealLevel,
  }));
}

export async function getAdminOffer(
  id: string,
): Promise<AdminOfferDetail | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      offer: offers,
      route: routes,
      origin: originAirport,
      destination: destinationAirport,
    })
    .from(offers)
    .innerJoin(routes, eq(offers.routeId, routes.id))
    .innerJoin(originAirport, eq(routes.origin, originAirport.iata))
    .innerJoin(
      destinationAirport,
      eq(routes.destination, destinationAirport.iata),
    )
    .where(eq(offers.id, id))
    .limit(1);

  if (!row) return null;
  const offer = row.offer;
  return {
    id: offer.id,
    slug: offer.slug,
    title: offer.title,
    priceCents: offer.priceCents,
    level: offer.level as DealLevel,
    status: offer.status,
    originIata: row.route.origin,
    destinationIata: row.route.destination,
    departureDate: offer.departureDate,
    returnDate: offer.returnDate,
    carrier: offer.carrier,
    createdAt: offer.createdAt,
    publishedAt: offer.publishedAt,
    clickCount: offer.clickCount,
    coldStart: offer.coldStart,
    routeId: offer.routeId,
    source: offer.source,
    stops: offer.stops,
    durationMinutes: offer.durationMinutes,
    bagsIncluded: offer.bagsIncluded,
    selfTransfer: offer.selfTransfer,
    deepLink: offer.deepLink,
    priceObservedAt: offer.priceObservedAt,
    expiresAt: offer.expiresAt,
    dedupHash: offer.dedupHash,
    reason: offer.reason,
  };
}

export async function getAdminRoutes(): Promise<RouteView[]> {
  const db = await getDb();
  const routeRows = await db
    .select({
      route: routes,
      origin: originAirport,
      destination: destinationAirport,
    })
    .from(routes)
    .innerJoin(originAirport, eq(routes.origin, originAirport.iata))
    .innerJoin(
      destinationAirport,
      eq(routes.destination, destinationAirport.iata),
    )
    .orderBy(asc(originAirport.city), asc(destinationAirport.city));

  const offerRows = await db
    .select({
      routeId: offers.routeId,
      priceCents: offers.priceCents,
      status: offers.status,
    })
    .from(offers);

  const aggregates = new Map<
    string,
    { best: number | null; count: number }
  >();
  for (const offer of offerRows) {
    const current = aggregates.get(offer.routeId) ?? {
      best: null,
      count: 0,
    };
    current.count += 1;
    if (offer.status === "published") {
      current.best =
        current.best == null
          ? offer.priceCents
          : Math.min(current.best, offer.priceCents);
    }
    aggregates.set(offer.routeId, current);
  }

  return routeRows.map((row) => {
    const aggregate = aggregates.get(row.route.id);
    return {
      id: row.route.id,
      origin: airportView(row.origin),
      destination: airportView(row.destination),
      monitorEnabled: row.route.monitorEnabled,
      priority: row.route.priority,
      maxStops: row.route.maxStops,
      maxDurationMinutes: row.route.maxDurationMinutes,
      ceilingCents: row.route.ceilingCents,
      lastCollectedAt: row.route.lastCollectedAt,
      bestPriceCents: aggregate?.best ?? null,
      offerCount: aggregate?.count ?? 0,
    };
  });
}

export async function getCollectorRuns(limit = 8) {
  const db = await getDb();
  return db
    .select()
    .from(collectorRuns)
    .orderBy(desc(collectorRuns.startedAt))
    .limit(limit);
}

export async function getOfferForRedirect(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: offers.id,
      slug: offers.slug,
      status: offers.status,
      expiresAt: offers.expiresAt,
      deepLink: offers.deepLink,
      departureDate: offers.departureDate,
      returnDate: offers.returnDate,
      origin: routes.origin,
      destination: routes.destination,
    })
    .from(offers)
    .innerJoin(routes, eq(offers.routeId, routes.id))
    .where(eq(offers.id, id))
    .limit(1);
  return row ?? null;
}

export async function trackClick(input: {
  offerId: string;
  channel: string;
  ipHash: string | null;
  uaHash: string | null;
  referrer: string | null;
}): Promise<string> {
  const db = await getDb();
  const clickId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(clicks).values({
      id: clickId,
      offerId: input.offerId,
      channel: input.channel,
      ipHash: input.ipHash,
      uaHash: input.uaHash,
      referrer: input.referrer,
    });
    await tx
      .update(offers)
      .set({ clickCount: sql`${offers.clickCount} + 1` })
      .where(eq(offers.id, input.offerId));
  });
  return clickId;
}

export async function getSitemapData() {
  const db = await getDb();
  const now = new Date();
  const offerRows = await db
    .select({ slug: offers.slug, publishedAt: offers.publishedAt })
    .from(offers)
    .where(publishedCondition(now))
    .orderBy(desc(offers.publishedAt))
    .limit(500);
  const routesWithOffers = (await getRoutesWithBestPrice()).filter(
    (route) => route.offerCount > 0,
  );
  return { offers: offerRows, routes: routesWithOffers };
}

export async function getOfferEvents(offerId: string) {
  const db = await getDb();
  return db
    .select()
    .from(offerEvents)
    .where(eq(offerEvents.offerId, offerId))
    .orderBy(desc(offerEvents.createdAt))
    .limit(50);
}

export async function getOfferNotifications(offerId: string) {
  const db = await getDb();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.offerId, offerId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}
