import { and, asc, desc, eq, gte, isNull } from "drizzle-orm";
import {
  getDb,
  offerEvents,
  offers,
  priceSnapshots,
} from "@ppa/db";
import { logJob } from "./utils";

export type RevalidateResult = {
  checked: number;
  expired: number;
  unchanged: number;
};

/**
 * Confere se o preço publicado ainda existe perto do valor original.
 * Só expira quando há uma coleta recente comprovando alta relevante;
 * ausência de coleta não é motivo para derrubar a oferta.
 */
export async function revalidatePublishedOffers(options: {
  now?: Date;
  limit?: number;
} = {}): Promise<RevalidateResult> {
  const db = await getDb();
  const now = options.now ?? new Date();
  const since = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const limit = options.limit ?? 100;

  const rows = await db
    .select()
    .from(offers)
    .where(and(eq(offers.status, "published"), gte(offers.expiresAt, now)))
    .orderBy(asc(offers.publishedAt))
    .limit(limit);

  let checked = 0;
  let expired = 0;
  let unchanged = 0;

  for (const offer of rows) {
    const conditions = [
      eq(priceSnapshots.routeId, offer.routeId),
      eq(priceSnapshots.source, offer.source),
      eq(priceSnapshots.departureDate, offer.departureDate),
      gte(priceSnapshots.observedAt, since),
    ];
    if (offer.carrier) {
      conditions.push(eq(priceSnapshots.carrier, offer.carrier));
    }
    if (offer.returnDate) {
      conditions.push(eq(priceSnapshots.returnDate, offer.returnDate));
    } else {
      conditions.push(isNull(priceSnapshots.returnDate));
    }

    const [latest] = await db
      .select({
        priceCents: priceSnapshots.priceCents,
        observedAt: priceSnapshots.observedAt,
      })
      .from(priceSnapshots)
      .where(and(...conditions))
      .orderBy(desc(priceSnapshots.observedAt))
      .limit(1);

    if (!latest) continue;
    checked += 1;

    if (latest.priceCents > offer.priceCents * 1.1) {
      await db
        .update(offers)
        .set({ status: "expired", updatedAt: now })
        .where(eq(offers.id, offer.id));
      await db.insert(offerEvents).values({
        offerId: offer.id,
        type: "price_rose",
        actor: "system",
        metadata: {
          oldPriceCents: offer.priceCents,
          newPriceCents: latest.priceCents,
        },
      });
      expired += 1;
    } else {
      await db
        .update(offers)
        .set({ priceObservedAt: latest.observedAt, updatedAt: now })
        .where(eq(offers.id, offer.id));
      unchanged += 1;
    }
  }

  const result = { checked, expired, unchanged };
  if (checked > 0) logJob("revalidate", "ofertas revalidadas", result);
  return result;
}
