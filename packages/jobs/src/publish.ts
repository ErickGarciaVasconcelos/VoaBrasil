import { and, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  alertRules,
  airports,
  getDb,
  notifications,
  offerEvents,
  offers,
  routes,
  subscribers,
  type OfferStatus,
} from "@ppa/db";
import { nextDigestAt } from "@ppa/core";
import { TTL_HOURS, telegramConfig } from "./config";
import { chunk, logJob } from "./utils";

const originAirport = alias(airports, "origin_airport");
const destinationAirport = alias(airports, "destination_airport");

export type OfferWithRoute = {
  offer: typeof offers.$inferSelect;
  route: typeof routes.$inferSelect;
  origin: typeof airports.$inferSelect;
  destination: typeof airports.$inferSelect;
};

export async function getOfferWithRoute(
  offerId: string,
): Promise<OfferWithRoute | null> {
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
    .where(eq(offers.id, offerId))
    .limit(1);
  return row ?? null;
}

async function enqueueNotifications(
  row: OfferWithRoute,
  now: Date,
): Promise<number> {
  const db = await getDb();
  const { offer, route } = row;
  let queued = 0;

  const telegram = telegramConfig();
  if (telegram.token && telegram.channelId) {
    const inserted = await db
      .insert(notifications)
      .values({
        offerId: offer.id,
        channel: "telegram",
        recipient: telegram.channelId,
        status: "pending",
        scheduledFor: now,
        dedupeKey: `${offer.id}:telegram:broadcast`,
      })
      .onConflictDoNothing({ target: notifications.dedupeKey })
      .returning({ id: notifications.id });
    queued += inserted.length;
  }

  const ruleRows = await db
    .select({
      subscriberId: subscribers.id,
      email: subscribers.email,
    })
    .from(alertRules)
    .innerJoin(subscribers, eq(alertRules.subscriberId, subscribers.id))
    .where(
      and(
        eq(alertRules.active, true),
        eq(subscribers.status, "confirmed"),
        or(isNull(alertRules.origin), eq(alertRules.origin, route.origin)),
        or(
          isNull(alertRules.destination),
          eq(alertRules.destination, route.destination),
        ),
        or(
          isNull(alertRules.maxPriceCents),
          gte(alertRules.maxPriceCents, offer.priceCents),
        ),
        or(
          isNull(alertRules.departFrom),
          lte(alertRules.departFrom, offer.departureDate),
        ),
        or(
          isNull(alertRules.departTo),
          gte(alertRules.departTo, offer.departureDate),
        ),
        or(
          isNull(alertRules.tripMinDays),
          sql`COALESCE(${offer.tripDays}, 0) >= ${alertRules.tripMinDays}`,
        ),
        or(
          isNull(alertRules.tripMaxDays),
          sql`COALESCE(${offer.tripDays}, 0) <= ${alertRules.tripMaxDays}`,
        ),
      ),
    );

  const uniqueSubscribers = new Map(
    ruleRows.map((rowItem) => [rowItem.subscriberId, rowItem.email]),
  );

  const scheduledFor =
    offer.level === "good" ? nextDigestAt(now) : now;

  const values = [...uniqueSubscribers.entries()].map(
    ([subscriberId, email]) => ({
      offerId: offer.id,
      subscriberId,
      channel: "email",
      recipient: email,
      status: "pending" as const,
      scheduledFor,
      dedupeKey: `${offer.id}:email:${subscriberId}`,
    }),
  );

  for (const batch of chunk(values, 300)) {
    const inserted = await db
      .insert(notifications)
      .values(batch)
      .onConflictDoNothing({ target: notifications.dedupeKey })
      .returning({ id: notifications.id });
    queued += inserted.length;
  }

  return queued;
}

export type PublishResult = {
  offerId: string;
  status: OfferStatus;
  notifications: number;
  expiresAt: Date | null;
};

export async function publishOffer(
  offerId: string,
  actor = "admin",
): Promise<PublishResult> {
  const db = await getDb();
  const row = await getOfferWithRoute(offerId);
  if (!row) throw new Error(`Oferta ${offerId} não encontrada.`);

  if (row.offer.status === "published") {
    return {
      offerId,
      status: "published",
      notifications: 0,
      expiresAt: row.offer.expiresAt,
    };
  }

  if (row.offer.status === "rejected" || row.offer.status === "expired") {
    throw new Error(
      `Oferta ${row.offer.status} precisa ser reaberta antes de publicar.`,
    );
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + TTL_HOURS[row.offer.level] * 3_600_000,
  );

  const published = await db
    .update(offers)
    .set({
      status: "published",
      publishedAt: now,
      expiresAt,
      updatedAt: now,
    })
    .where(
      and(
        eq(offers.id, offerId),
        inArray(offers.status, ["draft", "approved"]),
      ),
    )
    .returning({ id: offers.id });

  if (published.length === 0) {
    const current = await getOfferWithRoute(offerId);
    return {
      offerId,
      status: current?.offer.status ?? "draft",
      notifications: 0,
      expiresAt: current?.offer.expiresAt ?? null,
    };
  }

  await db.insert(offerEvents).values({
    offerId,
    type: "published",
    actor,
    metadata: { level: row.offer.level, priceCents: row.offer.priceCents },
  });

  const notificationsCount = await enqueueNotifications(
    { ...row, offer: { ...row.offer, status: "published", expiresAt } },
    now,
  );

  logJob("publish", "oferta publicada", {
    offerId,
    level: row.offer.level,
    notifications: notificationsCount,
  });

  return {
    offerId,
    status: "published",
    notifications: notificationsCount,
    expiresAt,
  };
}
