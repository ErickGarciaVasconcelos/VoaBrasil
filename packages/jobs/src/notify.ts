import { and, eq, lte } from "drizzle-orm";
import { getDb, notifications, offers } from "@ppa/db";
import { signToken } from "@ppa/core";
import {
  authSecret,
  emailFrom,
  siteUrl,
  telegramConfig,
} from "./config";
import { getOfferWithRoute, type OfferWithRoute } from "./publish";
import { logJob } from "./utils";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${value}T12:00:00Z`))
    .replace(".", "");
}

function formatDateRange(departure: string, returnDate: string | null): string {
  if (!returnDate) return formatDate(departure);
  return `${formatDate(departure)} – ${formatDate(returnDate)}`;
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

function stopsLabel(stops: number): string {
  if (stops <= 0) return "Direto";
  if (stops === 1) return "1 escala";
  return `${stops} escalas`;
}

function levelLabel(level: string): string {
  if (level === "error") return "🚨 Tarifa excepcional";
  if (level === "great") return "🔥 Oferta ótima";
  return "🟢 Boa oferta";
}

function offerUrl(row: OfferWithRoute, channel: string): string {
  return `${siteUrl()}/go/${row.offer.id}?c=${encodeURIComponent(channel)}`;
}

export function telegramMessage(row: OfferWithRoute): string {
  const { offer, origin, destination } = row;
  const bags =
    offer.bagsIncluded === false ? "\n🧳 Sem bagagem inclusa" : "";
  return [
    `${levelLabel(offer.level)}`,
    `<b>${escapeHtml(origin.city)} → ${escapeHtml(destination.city)}</b>`,
    `💸 <b>${formatBRL(offer.priceCents)}</b> ida e volta`,
    `📅 ${formatDateRange(offer.departureDate, offer.returnDate)} · ${offer.tripDays ?? "?"} dias`,
    `🛫 ${escapeHtml(offer.carrier ?? "Companhia a definir")} · ${stopsLabel(offer.stops)}${bags}`,
    `👀 Preço visto em ${formatDateTime(offer.priceObservedAt)}`,
    "",
    `<a href="${offerUrl(row, "telegram")}">Ver oferta e conferir preço</a>`,
  ].join("\n");
}

function emailHtml(row: OfferWithRoute, unsubscribeUrl: string): string {
  const { offer, origin, destination } = row;
  const bags =
    offer.bagsIncluded === false
      ? "<p style=\"margin:8px 0 0;color:#8a5a00;font-size:13px\">Sem bagagem inclusa</p>"
      : "";
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f7f2e8;font-family:Arial,Helvetica,sans-serif;color:#0b1b2b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2e8;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf8;border:1px solid #e4dccd;border-radius:16px;overflow:hidden">
        <tr><td style="padding:20px 24px;border-bottom:1px dashed #e4dccd">
          <span style="font-size:20px;font-weight:700;letter-spacing:-0.5px">voa leve<span style="color:#ff5a36">.</span></span>
        </td></tr>
        <tr><td style="padding:24px">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#0f766e;font-weight:700">${levelLabel(offer.level)}</p>
          <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2">${escapeHtml(origin.city)} → ${escapeHtml(destination.city)}</h1>
          <p style="margin:0 0 4px;font-size:40px;font-weight:800;letter-spacing:-1px">${formatBRL(offer.priceCents)}</p>
          <p style="margin:0 0 20px;color:#33475b;font-size:14px">ida e volta · ${formatDateRange(offer.departureDate, offer.returnDate)} · ${offer.tripDays ?? "?"} dias</p>
          <p style="margin:0 0 20px;color:#33475b;font-size:14px">${escapeHtml(offer.carrier ?? "Companhia a definir")} · ${stopsLabel(offer.stops)}</p>
          ${bags}
          <a href="${offerUrl(row, "email")}" style="display:inline-block;background:#ff5a36;color:#fffdf8;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px;font-size:15px">Ver oferta e conferir preço</a>
          <p style="margin:20px 0 0;color:#6b7a89;font-size:12px;line-height:1.5">Preço observado em ${formatDateTime(offer.priceObservedAt)}. Tarifas aéreas mudam rápido e podem esgotar antes do clique. Confirme o valor no site da companhia ou agência antes de comprar.</p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f7f2e8;color:#6b7a89;font-size:11px;line-height:1.6">
          Você recebeu este e-mail porque criou um alerta no Voa Leve. Podemos receber comissão de afiliado em compras feitas pelos nossos links, sem custo extra para você.<br>
          <a href="${unsubscribeUrl}" style="color:#0f766e">Cancelar inscrição</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function offerEmail(
  row: OfferWithRoute,
  unsubscribeUrl: string,
): { subject: string; html: string } {
  return {
    subject: `✈️ ${row.origin.city} → ${row.destination.city} por ${formatBRL(row.offer.priceCents)}`,
    html: emailHtml(row, unsubscribeUrl),
  };
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ simulated: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.log(
      `[notify] e-mail simulado para ${input.to}: ${input.subject}`,
    );
    return { simulated: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`);
  }
  return { simulated: false };
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ simulated: boolean }> {
  return sendEmail(input);
}

async function sendTelegram(
  row: OfferWithRoute,
  recipient: string,
): Promise<{ messageId: number | null }> {
  const { token } = telegramConfig();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN não configurado");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: recipient,
        text: telegramMessage(row),
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
    result?: { message_id?: number };
  };

  if (!response.ok || !payload.ok) {
    throw new Error(
      `Telegram: ${payload.description ?? `HTTP ${response.status}`}`,
    );
  }
  return { messageId: payload.result?.message_id ?? null };
}

export type DispatchResult = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
};

export async function dispatchNotifications(options: {
  now?: Date;
  limit?: number;
} = {}): Promise<DispatchResult> {
  const db = await getDb();
  const now = options.now ?? new Date();
  const limit = options.limit ?? 50;

  const pending = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.status, "pending"),
        lte(notifications.scheduledFor, now),
      ),
    )
    .orderBy(notifications.scheduledFor)
    .limit(limit);

  const cache = new Map<string, OfferWithRoute | null>();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of pending) {
    let row = cache.get(item.offerId);
    if (row === undefined) {
      row = await getOfferWithRoute(item.offerId);
      cache.set(item.offerId, row);
    }

    const attempts = item.attempts + 1;

    if (!row) {
      await db
        .update(notifications)
        .set({
          status: "failed",
          attempts,
          error: "Oferta não encontrada",
        })
        .where(eq(notifications.id, item.id));
      failed += 1;
      continue;
    }

    try {
      if (item.channel === "telegram") {
        const result = await sendTelegram(row, item.recipient);
        if (result.messageId) {
          await db
            .update(offers)
            .set({ telegramMessageId: String(result.messageId) })
            .where(eq(offers.id, row.offer.id));
        }
        await db
          .update(notifications)
          .set({
            status: "sent",
            attempts,
            sentAt: now,
            error: null,
          })
          .where(eq(notifications.id, item.id));
        sent += 1;
        continue;
      }

      if (item.channel === "email") {
        if (!item.subscriberId) {
          await db
            .update(notifications)
            .set({
              status: "failed",
              attempts,
              error: "Assinante ausente",
            })
            .where(eq(notifications.id, item.id));
          failed += 1;
          continue;
        }
        const token = signToken(
          { sub: item.subscriberId, purpose: "unsubscribe" },
          authSecret(),
          365 * 24 * 60 * 60,
        );
        const unsubscribeUrl = `${siteUrl()}/api/unsubscribe?token=${encodeURIComponent(token)}`;
        const email = offerEmail(row, unsubscribeUrl);
        const result = await sendEmail({
          to: item.recipient,
          subject: email.subject,
          html: email.html,
        });

        await db
          .update(notifications)
          .set({
            status: result.simulated ? "skipped" : "sent",
            attempts,
            sentAt: result.simulated ? null : now,
            error: result.simulated
              ? "RESEND_API_KEY não configurado (envio simulado)"
              : null,
          })
          .where(eq(notifications.id, item.id));
        if (result.simulated) skipped += 1;
        else sent += 1;
        continue;
      }

      await db
        .update(notifications)
        .set({
          status: "skipped",
          attempts,
          error: `Canal desconhecido: ${item.channel}`,
        })
        .where(eq(notifications.id, item.id));
      skipped += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .update(notifications)
        .set({
          status: attempts >= 3 ? "failed" : "pending",
          attempts,
          error: message.slice(0, 500),
        })
        .where(eq(notifications.id, item.id));
      failed += 1;
    }
  }

  const result = { processed: pending.length, sent, failed, skipped };
  if (pending.length > 0) {
    logJob("notify", "notificações processadas", result);
  }
  return result;
}
