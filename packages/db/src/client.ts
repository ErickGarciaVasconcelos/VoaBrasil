import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import {
  drizzle as drizzlePostgres,
  type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

type DbGlobals = typeof globalThis & {
  __ppaDb?: Promise<Database>;
  __ppaPgClient?: ReturnType<typeof postgres>;
  __ppaPglite?: PGlite;
};

const globalForDb = globalThis as DbGlobals;

export function usingPglite(): boolean {
  return !process.env.DATABASE_URL?.trim();
}

export function getPgliteDataDir(): string {
  const configured = process.env.PGLITE_DATA_DIR?.trim();
  if (configured) return path.resolve(configured);

  // Evita OneDrive/arquivos sincronizados: o PGlite mantém um diretório
  // Postgres completo e não lida bem com locks de sincronização.
  if (process.platform === "win32") {
    return path.join(
      process.env.LOCALAPPDATA ?? os.homedir(),
      "voa-leve",
      "pglite",
    );
  }
  if (process.platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "voa-leve",
      "pglite",
    );
  }
  return path.join(
    process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"),
    "voa-leve",
    "pglite",
  );
}

async function createDatabase(): Promise<Database> {
  const url = process.env.DATABASE_URL?.trim();

  if (url) {
    const client = postgres(url, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      onnotice: () => undefined,
    });
    globalForDb.__ppaPgClient = client;
    return drizzlePostgres(client, { schema }) as Database;
  }

  const dataDir = getPgliteDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  const pglite = await PGlite.create({ dataDir });
  globalForDb.__ppaPglite = pglite;
  return drizzlePglite(pglite, { schema }) as unknown as Database;
}

export function getDb(): Promise<Database> {
  if (!globalForDb.__ppaDb) {
    globalForDb.__ppaDb = createDatabase();
  }
  return globalForDb.__ppaDb;
}

export async function closeDb(): Promise<void> {
  if (globalForDb.__ppaPgClient) {
    await globalForDb.__ppaPgClient.end({ timeout: 5 });
    globalForDb.__ppaPgClient = undefined;
  }
  if (globalForDb.__ppaPglite) {
    await globalForDb.__ppaPglite.close();
    globalForDb.__ppaPglite = undefined;
  }
  globalForDb.__ppaDb = undefined;
}
