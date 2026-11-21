import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, usingPglite } from "@ppa/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({
      ok: true,
      service: "voa-leve-web",
      database: usingPglite() ? "pglite" : "postgres",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/health] erro:", error);
    return NextResponse.json(
      {
        ok: false,
        service: "voa-leve-web",
        database: "unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
