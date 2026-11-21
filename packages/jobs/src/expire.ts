import { and, eq, lte } from "drizzle-orm";
import { getDb, offerEvents, offers } from "@ppa/db";
import { telegramConfig } from "./config";
import { logJob } from "./utils";

export type ExpireResult = {
  expired: number;
  telegramDeleted: number;
};

export async function expireOffers(options: {
  now?: Date;
} = {}): Promise<ExpireResult> {
  const db = await getDb();
  const now = options.now ?? new Date();
  const rows = await db
    .select()
    .from(offers)
    .where(and(eq(offers.status, "published"), lte(offers.expiresAt, now)));

  const { token, channelId } = telegramConfig();
  let telegramDeleted = 0;

  for (const offer of rows) {
    await db
      .update(offers)
      .set({ status: "expired", updatedAt: now })
      .where(eq(offers.id, offer.id));

    await db.insert(offerEvents).values({
      offerId: offer.id,
      type: "expired",
      actor: "system",
      metadata: {
        expiresAt: offer.expiresAt?.toISOString() ?? null,
        priceCents: offer.priceCents,
      },
    });

    if (token && channelId && offer.telegramMessageId) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${token}/deleteMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: channelId,
              message_id: Number(offer.telegramMessageId),
            }),
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (response.ok) telegramDeleted += 1;
      } catch {
        // Excluir a mensagem é best-effort; a oferta já foi expirada no banco.
      }
    }
  }

  const result = { expired: rows.length, telegramDeleted };
  if (rows.length > 0) logJob("expire", "ofertas expiradas", result);
  return result;
}
