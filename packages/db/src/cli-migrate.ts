import path from "node:path";
import { config } from "dotenv";
import { findRepoRoot } from "./root";

config({ path: path.join(findRepoRoot(), ".env") });

const { runMigrations } = await import("./migrate");
const { closeDb, usingPglite, getPgliteDataDir } = await import("./client");

try {
  await runMigrations();
  console.log(
    usingPglite()
      ? `Migrations aplicadas no PGlite (${getPgliteDataDir()}).`
      : "Migrations aplicadas no Postgres.",
  );
} finally {
  await closeDb();
}
