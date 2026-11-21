import type { BucketStats, PricePoint } from "./types";

export function median(sortedOrUnsorted: number[]): number {
  if (sortedOrUnsorted.length === 0) return 0;
  const values = [...sortedOrUnsorted].sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    return (values[mid - 1] + values[mid]) / 2;
  }
  return values[mid];
}

/** Percentil com interpolação linear. `p` entre 0 e 1. */
export function percentile(sortedOrUnsorted: number[], p: number): number {
  if (sortedOrUnsorted.length === 0) return 0;
  const values = [...sortedOrUnsorted].sort((a, b) => a - b);
  if (p <= 0) return values[0];
  if (p >= 1) return values[values.length - 1];
  const index = (values.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return values[lower];
  const weight = index - lower;
  return values[lower] + (values[upper] - values[lower]) * weight;
}

export function dateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

/**
 * Calcula estatísticas robustas de uma série de preços.
 * A mediana e o MAD são usados no lugar da média/desvio padrão porque
 * uma única tarifa-erro distorce média e desvio de forma irreversível.
 */
export function computeStats(points: PricePoint[]): BucketStats | null {
  const clean = points.filter(
    (point) => Number.isFinite(point.priceCents) && point.priceCents > 0,
  );
  if (clean.length === 0) return null;

  const values = clean.map((point) => point.priceCents);
  const sorted = [...values].sort((a, b) => a - b);
  const unique = [...new Set(sorted)];
  const med = median(sorted);
  const deviations = sorted.map((value) => Math.abs(value - med));

  return {
    p01Cents: Math.round(percentile(sorted, 0.01)),
    p10Cents: Math.round(percentile(sorted, 0.1)),
    p25Cents: Math.round(percentile(sorted, 0.25)),
    p50Cents: Math.round(med),
    p90Cents: Math.round(percentile(sorted, 0.9)),
    minCents: sorted[0],
    min2Cents: unique[1] ?? unique[0],
    maxCents: sorted[sorted.length - 1],
    madCents: Math.round(median(deviations)),
    sampleDays: new Set(clean.map((point) => dateKey(point.observedAt))).size,
    sampleCount: clean.length,
  };
}

/**
 * Rank percentil: fração de preços menores ou iguais ao preço analisado.
 * Preço mais baixo da amostra retorna ~1/n (rank pequeno = bom).
 */
export function percentileRank(sorted: number[], priceCents: number): number {
  if (sorted.length === 0) return 1;
  let count = 0;
  for (const value of sorted) {
    if (value <= priceCents) count += 1;
  }
  return count / sorted.length;
}

/**
 * Z-score robusto. Se MAD = 0 (série sem variação), usa uma escala
 * proporcional à mediana para não dividir por zero.
 */
export function robustZ(priceCents: number, stats: BucketStats): number {
  if (stats.madCents > 0) {
    return (0.6745 * (priceCents - stats.p50Cents)) / stats.madCents;
  }
  const scale = Math.max(1, stats.p50Cents * 0.05);
  return (priceCents - stats.p50Cents) / scale;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
