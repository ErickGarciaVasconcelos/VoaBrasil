import { NextResponse } from "next/server";
import { hashToken } from "@ppa/core";
import { authSecret } from "@ppa/jobs";
import { getOfferForRedirect, trackClick } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_AFFILIATE_HOSTS = [
  "www.google.com",
  "www.aviasales.com",
  "aviasales.com",
  "www.travelpayouts.com",
  "travelpayouts.com",
  "www.kiwi.com",
  "kiwi.com",
];

function allowedAffiliateHosts(): Set<string> {
  const configured = process.env.ALLOWED_AFFILIATE_HOSTS?.split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return new Set(configured?.length ? configured : DEFAULT_AFFILIATE_HOSTS);
}

function safeDestination(value: string | null): string | null {
  if (!value) return null;
  try {
    // URL absoluta: links relativos/protocol-relative (//evil.com) não são
    // aceitos como destino de afiliado.
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (!allowedAffiliateHosts().has(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);

  let offer = null;
  try {
    offer = await getOfferForRedirect(id);
  } catch (error) {
    console.error("[go] erro ao buscar oferta:", error);
    return NextResponse.redirect(new URL("/ofertas?erro=indisponivel", url.origin));
  }

  if (!offer) {
    return NextResponse.redirect(
      new URL("/ofertas?erro=nao-encontrada", url.origin),
    );
  }

  const expired =
    offer.status !== "published" ||
    (offer.expiresAt != null && offer.expiresAt.getTime() < Date.now());

  if (expired) {
    return NextResponse.redirect(
      new URL("/ofertas?erro=expirada", url.origin),
    );
  }

  const rawChannel = url.searchParams.get("c") ?? "site";
  const channel = /^[a-z0-9_-]{1,32}$/i.test(rawChannel)
    ? rawChannel.toLowerCase()
    : "site";

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || null;
  const userAgent = request.headers.get("user-agent");
  const secret = authSecret();

  try {
    await trackClick({
      offerId: offer.id,
      channel,
      ipHash: ip ? hashToken(ip, secret) : null,
      uaHash: userAgent ? hashToken(userAgent, secret) : null,
      referrer: request.headers.get("referer"),
    });
  } catch (error) {
    console.error("[go] erro ao registrar clique:", error);
  }

  const destination =
    safeDestination(offer.deepLink) ??
    new URL(
      `/passagens/${offer.origin}/${offer.destination}`,
      url.origin,
    ).toString();

  return NextResponse.redirect(destination, 302);
}
