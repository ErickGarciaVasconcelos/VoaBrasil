import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { alertRules, getDb, subscribers } from "@ppa/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendConfirmationEmail, unsubscribeUrl } from "@/lib/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const alertSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5)
    .max(254)
    .email("Informe um e-mail válido."),
  origin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Origem inválida.")
    .nullable()
    .optional(),
  destination: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Destino inválido.")
    .nullable()
    .optional(),
  maxPrice: z.number().positive().max(10_000_000).nullable().optional(),
  departFrom: z
    .string()
    .regex(datePattern, "Data inicial inválida.")
    .nullable()
    .optional(),
  departTo: z
    .string()
    .regex(datePattern, "Data final inválida.")
    .nullable()
    .optional(),
  consent: z.literal(true, {
    error: "É necessário aceitar a política de privacidade.",
  }),
  website: z.string().max(200).optional(),
});

function optionalDate(value: string | null | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`alerts:${ip}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  const parsed = alertSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error:
          parsed.error.issues[0]?.message ?? "Confira os dados e tente novamente.",
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  if (input.website && input.website.trim().length > 0) {
    return NextResponse.json({ ok: true, message: "Tudo certo." });
  }

  const origin = input.origin ?? null;
  const destination = input.destination ?? null;
  if (origin && destination && origin === destination) {
    return NextResponse.json(
      { ok: false, error: "Origem e destino precisam ser diferentes." },
      { status: 400 },
    );
  }
  const departFrom = optionalDate(input.departFrom);
  const departTo = optionalDate(input.departTo);
  if (departFrom && departTo && departFrom > departTo) {
    return NextResponse.json(
      { ok: false, error: "A data inicial precisa vir antes da data final." },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const now = new Date();
    const [existing] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, input.email))
      .limit(1);

    let subscriber = existing;
    if (!subscriber) {
      [subscriber] = await db
        .insert(subscribers)
        .values({
          email: input.email,
          status: "pending",
          consentAt: now,
          consentSource: "site",
        })
        .returning();
    } else if (subscriber.status === "unsubscribed") {
      [subscriber] = await db
        .update(subscribers)
        .set({
          status: "pending",
          consentAt: now,
          consentSource: "site",
          unsubscribedAt: null,
          confirmedAt: null,
          updatedAt: now,
        })
        .where(eq(subscribers.id, subscriber.id))
        .returning();
    }

    if (!subscriber) {
      throw new Error("Não foi possível registrar o assinante.");
    }

    const maxPriceCents = input.maxPrice
      ? Math.round(input.maxPrice * 100)
      : null;

    const ruleConditions = [
      eq(alertRules.subscriberId, subscriber.id),
      origin ? eq(alertRules.origin, origin) : isNull(alertRules.origin),
      destination
        ? eq(alertRules.destination, destination)
        : isNull(alertRules.destination),
      maxPriceCents
        ? eq(alertRules.maxPriceCents, maxPriceCents)
        : isNull(alertRules.maxPriceCents),
      departFrom
        ? eq(alertRules.departFrom, departFrom)
        : isNull(alertRules.departFrom),
      departTo
        ? eq(alertRules.departTo, departTo)
        : isNull(alertRules.departTo),
    ];

    const [existingRule] = await db
      .select({ id: alertRules.id })
      .from(alertRules)
      .where(and(...ruleConditions))
      .limit(1);

    if (existingRule) {
      await db
        .update(alertRules)
        .set({ active: true, channels: ["email"] })
        .where(eq(alertRules.id, existingRule.id));
    } else {
      await db.insert(alertRules).values({
        subscriberId: subscriber.id,
        origin,
        destination,
        maxPriceCents,
        departFrom,
        departTo,
        channels: ["email"],
        active: true,
      });
    }

    if (subscriber.status === "confirmed") {
      return NextResponse.json({
        ok: true,
        message:
          "Alerta atualizado. Você já confirmou seu e-mail, então não precisa fazer mais nada.",
      });
    }

    const routeLabel =
      origin && destination ? `${origin} → ${destination}` : null;
    const confirmation = await sendConfirmationEmail({
      to: subscriber.email,
      subscriberId: subscriber.id,
      routeLabel,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Quase lá! Enviamos um link de confirmação para o seu e-mail. Confirme para ativar o alerta.",
      devConfirmUrl:
        process.env.NODE_ENV !== "production" && confirmation.simulated
          ? confirmation.url
          : undefined,
      devUnsubscribeUrl:
        process.env.NODE_ENV !== "production"
          ? unsubscribeUrl(subscriber.id)
          : undefined,
    });
  } catch (error) {
    console.error("[api/alerts] erro:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Não foi possível criar o alerta agora. Tente novamente.",
      },
      { status: 500 },
    );
  }
}
