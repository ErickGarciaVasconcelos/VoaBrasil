import path from "node:path";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { getDb, usingPglite } from "./client";
import { findRepoRoot } from "./root";
import type * as schema from "./schema";

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  const migrationsFolder = path.join(
    findRepoRoot(),
    "packages",
    "db",
    "drizzle",
  );

  if (usingPglite()) {
    await migratePglite(
      db as unknown as PgliteDatabase<typeof schema>,
      { migrationsFolder },
    );
    return;
  }

  await migratePostgres(db, { migrationsFolder });
}
