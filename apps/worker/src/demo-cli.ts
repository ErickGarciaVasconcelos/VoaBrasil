import "./env";
import { closeDb, getPgliteDataDir, usingPglite } from "@ppa/db";
import { seedDemo } from "@ppa/jobs";

const reset = process.argv.includes("--reset");

try {
  const result = await seedDemo({ reset });
  console.log(JSON.stringify(result, null, 2));
  if (usingPglite()) {
    console.log(`Banco local: ${getPgliteDataDir()}`);
  }
} finally {
  await closeDb();
}
