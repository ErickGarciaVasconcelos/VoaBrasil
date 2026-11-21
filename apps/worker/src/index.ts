import "./env";
import { Cron } from "croner";
import {
  closeDb,
  getPgliteDataDir,
  runMigrations,
  usingPglite,
} from "@ppa/db";
import {
  collectPrices,
  detectDeals,
  dispatchNotifications,
  expireOffers,
  priceSourceId,
  revalidatePublishedOffers,
  refreshBucketStats,
  withJobRun,
} from "@ppa/jobs";

const crons: Cron[] = [];

function schedule(
  name: string,
  pattern: string,
  fn: () => Promise<unknown>,
  timezone?: string,
): void {
  const job = new Cron(
    pattern,
    { timezone, protect: true },
    async () => {
      try {
        await withJobRun(name, fn);
      } catch (error) {
        console.error(
          `[${new Date().toISOString()}] [${name}] falhou:`,
          error instanceof Error ? error.message : error,
        );
      }
    },
  );
  crons.push(job);
  console.log(`[worker] ${name} agendado (${pattern})`);
}

async function runOnce(): Promise<void> {
  await withJobRun("collect", () => collectPrices());
  await withJobRun("stats", () => refreshBucketStats());
  await withJobRun("detect", () => detectDeals({ autoPublish: true }));
  await withJobRun("notify", () => dispatchNotifications());
  await withJobRun("expire", () => expireOffers());
}

async function main(): Promise<void> {
  await runMigrations();

  const mode = usingPglite()
    ? `PGlite (${getPgliteDataDir()})`
    : "Postgres (DATABASE_URL)";
  console.log(`[worker] banco: ${mode}`);
  console.log(`[worker] fonte de preço: ${priceSourceId()}`);

  if (usingPglite()) {
    console.warn(
      "[worker] AVISO: PGlite é single-process. Não rode o worker junto com o site; use um Postgres para produção ou o painel admin para disparos manuais.",
    );
  }

  if (process.argv.includes("--once")) {
    await runOnce();
    await closeDb();
    return;
  }

  schedule("collect", "0 */3 * * *", () => collectPrices());
  schedule("stats", "0 3 * * *", () => refreshBucketStats(), "America/Sao_Paulo");
  schedule("detect", "*/30 * * * *", () =>
    detectDeals({ autoPublish: true }),
  );
  schedule("notify", "* * * * *", () => dispatchNotifications());
  schedule("expire", "*/15 * * * *", () => expireOffers());
  schedule("revalidate", "0 */6 * * *", () =>
    revalidatePublishedOffers(),
  );

  await withJobRun("expire", () => expireOffers());
}

async function shutdown(signal: string): Promise<void> {
  console.log(`[worker] encerrando (${signal})...`);
  for (const job of crons) job.stop();
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("[worker] unhandledRejection:", reason);
});

main().catch(async (error) => {
  console.error("[worker] erro fatal:", error);
  await closeDb();
  process.exit(1);
});
