import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { verifyToken } from "@ppa/core";
import { getDb, subscribers } from "@ppa/db";
import { authSecret } from "@ppa/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const payload = verifyToken(token, authSecret());

  if (!payload || payload.purpose !== "confirm") {
    return NextResponse.redirect(
      new URL("/alertas/confirmado?status=invalido", url.origin),
    );
  }

  try {
    const db = await getDb();
    const now = new Date();
    const [updated] = await db
      .update(subscribers)
      .set({ status: "confirmed", confirmedAt: now, updatedAt: now })
      .where(eq(subscribers.id, payload.sub))
      .returning({ id: subscribers.id });

    if (!updated) {
      return NextResponse.redirect(
        new URL("/alertas/confirmado?status=invalido", url.origin),
      );
    }

    return NextResponse.redirect(
      new URL("/alertas/confirmado?status=ok", url.origin),
    );
  } catch (error) {
    console.error("[api/confirm] erro:", error);
    return NextResponse.redirect(
      new URL("/alertas/confirmado?status=erro", url.origin),
    );
  }
}
