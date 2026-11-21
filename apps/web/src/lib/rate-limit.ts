type Bucket = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __ppaRateLimit?: Map<string, Bucket>;
};

const buckets = globalStore.__ppaRateLimit ?? new Map<string, Bucket>();
globalStore.__ppaRateLimit = buckets;

const MAX_KEYS = 5_000;

function prune(now: number): void {
  if (buckets.size <= MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size > MAX_KEYS) {
    const oldest = buckets.keys().next().value;
    if (!oldest) break;
    buckets.delete(oldest);
  }
}

export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): { ok: boolean; remaining: number } {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

export function clientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip")?.trim() || "unknown";
}
