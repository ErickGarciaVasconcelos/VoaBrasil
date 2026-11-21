import { NextResponse } from "next/server";
import { getPublishedOffers } from "@/lib/queries";
import type { DealLevel } from "@ppa/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.searchParams.get("origin")?.trim().toUpperCase();
  const destination = url.searchParams.get("destination")?.trim().toUpperCase();
  const levelParam = url.searchParams.get("level");
  const level =
    levelParam && ["good", "great", "error"].includes(levelParam)
      ? (levelParam as DealLevel)
      : undefined;
  const limitParam = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), 50)
    : 20;

  try {
    const offers = await getPublishedOffers({
      origin,
      destination,
      level,
      limit,
    });

    return NextResponse.json(
      { ok: true, count: offers.length, offers },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[api/offers] erro:", error);
    return NextResponse.json(
      { ok: false, error: "Não foi possível listar as ofertas." },
      { status: 500 },
    );
  }
}
