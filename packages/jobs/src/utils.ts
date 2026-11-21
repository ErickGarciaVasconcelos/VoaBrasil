import { eq } from "drizzle-orm";
import { getDb, jobRuns } from "@ppa/db";

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function logJob(job: string, message: string, data?: unknown): void {
  const suffix = data === undefined ? "" : ` ${JSON.stringify(data)}`;
  console.log(`[${new Date().toISOString()}] [${job}] ${message}${suffix}`);
}

function serializable(value: unknown): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return { note: "resultado não serializável" };
  }
}

export async function withJobRun<T>(
  job: string,
  fn: () => Promise<T>,
): Promise<T> {
  const db = await getDb();
  const [run] = await db
    .insert(jobRuns)
    .values({ job, status: "running" })
    .returning();

  try {
    const result = await fn();
    await db
      .update(jobRuns)
      .set({
        status: "success",
        finishedAt: new Date(),
        details: serializable(result),
      })
      .where(eq(jobRuns.id, run.id));
    return result;
  } catch (error) {
    await db
      .update(jobRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      })
      .where(eq(jobRuns.id, run.id));
    throw error;
  }
}
