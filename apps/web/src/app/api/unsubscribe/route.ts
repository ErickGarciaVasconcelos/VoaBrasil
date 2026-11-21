import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { verifyToken } from "@ppa/core";
import { alertRules, getDb, subscribers } from "@ppa/db";
import { authSecret } from "@ppa/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const payload = verifyToken(token, authSecret());

  if (!payload || payload.purpose !== "unsubscribe") {
    return NextResponse.redirect(
      new URL("/alertas/descadastrado?status=invalido", url.origin),
    );
  }

  try {
    const db = await getDb();
    const now = new Date();
    const [updated] = await db
      .update(subscribers)
      .set({
        status: "unsubscribed",
        unsubscribedAt: now,
        updatedAt: now,
      })
      .where(eq(subscribers.id, payload.sub))
      .returning({ id: subscribers.id });

    if (!updated) {
      return NextResponse.redirect(
        new URL("/alertas/descadastrado?status=invalido", url.origin),
      );
    }

    await db
      .update(alertRules)
      .set({ active: false })
      .where(eq(alertRules.subscriberId, updated.id));

    return NextResponse.redirect(
      new URL("/alertas/descadastrado?status=ok", url.origin),
    );
  } catch (error) {
    console.error("[api/unsubscribe] erro:", error);
    return NextResponse.redirect(
      new URL("/alertas/descadastrado?status=erro", url.origin),
    );
  }
}
