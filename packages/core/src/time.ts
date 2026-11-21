const BRT_OFFSET_MINUTES = -180;

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Próximo horário de digest: 18:00 em America/Sao_Paulo (UTC-3, sem DST). */
export function nextDigestAt(now: Date = new Date()): Date {
  const brt = new Date(now.getTime() + BRT_OFFSET_MINUTES * 60 * 1000);
  const year = brt.getUTCFullYear();
  const month = brt.getUTCMonth();
  const day = brt.getUTCDate();
  let targetUtc =
    Date.UTC(year, month, day, 18, 0, 0) - BRT_OFFSET_MINUTES * 60 * 1000;
  if (targetUtc <= now.getTime()) {
    targetUtc += 24 * 60 * 60 * 1000;
  }
  return new Date(targetUtc);
}

export function dateOnly(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function isPast(value: Date | string | null | undefined, now = new Date()): boolean {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime() <= now.getTime();
}
