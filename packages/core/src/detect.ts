import { clamp01, robustZ, round } from "./stats";
import {
  DEFAULT_DETECTION_CONFIG,
  type BucketStats,
  type ClassifyOptions,
  type DealClassification,
  type DealLevel,
  type DealReason,
  type DetectionConfig,
} from "./types";

function estimatedRank(stats: BucketStats, priceCents: number): number {
  if (priceCents <= stats.p01Cents) return 0.01;
  if (priceCents <= stats.p10Cents) return 0.1;
  if (priceCents <= stats.p25Cents) return 0.25;
  if (priceCents <= stats.p50Cents) return 0.5;
  if (priceCents <= stats.p90Cents) return 0.9;
  return 0.97;
}

function baseReason(
  stats: BucketStats,
  priceCents: number,
  config: DetectionConfig,
): DealReason {
  return {
    version: config.version,
    ratio: round(priceCents / stats.p50Cents, 4),
    percentileRank: estimatedRank(stats, priceCents),
    robustZ: round(robustZ(priceCents, stats), 2),
    sampleDays: stats.sampleDays,
    sampleCount: stats.sampleCount,
    p01Cents: stats.p01Cents,
    p10Cents: stats.p10Cents,
    p25Cents: stats.p25Cents,
    p50Cents: stats.p50Cents,
    p90Cents: stats.p90Cents,
    minCents: stats.minCents,
    min2Cents: stats.min2Cents,
    madCents: stats.madCents,
    rules: [],
  };
}

function scoreFor(
  priceCents: number,
  stats: BucketStats,
  config: DetectionConfig,
  ceilingCents?: number | null,
): number {
  const ratio = priceCents / stats.p50Cents;
  const discount = clamp01(1 - ratio);
  const rankScore = clamp01(1 - estimatedRank(stats, priceCents));
  const absolute = ceilingCents
    ? clamp01(1 - priceCents / ceilingCents)
    : discount;
  return round(0.45 * discount + 0.35 * rankScore + 0.2 * absolute, 4);
}

/**
 * Classifica um preço contra o histórico do bucket.
 * Retorna `null` quando não há amostra suficiente, o preço está abaixo do
 * piso de sanidade ou o preço não configura promoção.
 */
export function classifyDeal(
  priceCents: number,
  stats: BucketStats,
  config: DetectionConfig = DEFAULT_DETECTION_CONFIG,
  options: ClassifyOptions = {},
): DealClassification | null {
  if (
    stats.sampleDays < config.minSampleDays ||
    stats.sampleCount < config.minSampleCount
  ) {
    return null;
  }
  if (!Number.isFinite(priceCents) || priceCents < config.minPriceCents) {
    return null;
  }

  const reason = baseReason(stats, priceCents, config);
  const previousMin = options.previousMinCents ?? stats.min2Cents;
  const confirmations = options.confirmations ?? 1;
  const isError =
    priceCents <= stats.p01Cents &&
    reason.ratio <= config.errorRatio &&
    priceCents <= previousMin * (1 - config.errorDropVsMin) &&
    confirmations >= 2;

  let level: DealLevel | null = null;
  if (isError) {
    level = "error";
    reason.rules.push(
      "price<=p01",
      `ratio<=${config.errorRatio}`,
      `drop>=${config.errorDropVsMin}`,
      "confirmed>=2",
    );
  } else if (
    priceCents <= stats.p10Cents ||
    reason.ratio <= config.greatRatio
  ) {
    level = "great";
    reason.rules.push(
      priceCents <= stats.p10Cents ? "price<=p10" : "",
      reason.ratio <= config.greatRatio ? `ratio<=${config.greatRatio}` : "",
    );
  } else if (
    priceCents <= stats.p25Cents ||
    reason.ratio <= config.goodRatio
  ) {
    level = "good";
    reason.rules.push(
      priceCents <= stats.p25Cents ? "price<=p25" : "",
      reason.ratio <= config.goodRatio ? `ratio<=${config.goodRatio}` : "",
    );
  }

  if (!level) return null;
  reason.rules = reason.rules.filter(Boolean);

  return {
    level,
    score: scoreFor(priceCents, stats, config, options.ceilingCents),
    reason,
  };
}

/**
 * Regra provisória para as primeiras semanas, quando ainda não existe
 * histórico suficiente. Usa um teto manual por rota e sempre exige revisão.
 */
export function coldStartDeal(
  priceCents: number,
  ceilingCents: number | null | undefined,
  config: DetectionConfig = DEFAULT_DETECTION_CONFIG,
): DealClassification | null {
  if (!ceilingCents || ceilingCents <= 0) return null;
  if (!Number.isFinite(priceCents) || priceCents < config.minPriceCents) {
    return null;
  }
  if (priceCents > ceilingCents) return null;

  const ratio = priceCents / ceilingCents;
  const level: DealLevel = ratio <= 0.8 ? "great" : "good";
  return {
    level,
    score: round(0.65 * clamp01(1 - ratio) + 0.175, 4),
    reason: {
      version: config.version,
      ratio: round(ratio, 4),
      percentileRank: 0.5,
      robustZ: 0,
      sampleDays: 0,
      sampleCount: 0,
      p01Cents: 0,
      p10Cents: 0,
      p25Cents: 0,
      p50Cents: ceilingCents,
      p90Cents: ceilingCents,
      minCents: ceilingCents,
      min2Cents: ceilingCents,
      madCents: 0,
      coldStart: true,
      rules: ["cold_start_ceiling"],
    },
  };
}
