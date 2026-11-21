export type DealLevel = "good" | "great" | "error";

export type BucketStats = {
  p01Cents: number;
  p10Cents: number;
  p25Cents: number;
  p50Cents: number;
  p90Cents: number;
  minCents: number;
  min2Cents: number;
  maxCents: number;
  madCents: number;
  sampleDays: number;
  sampleCount: number;
};

export type PricePoint = {
  priceCents: number;
  observedAt: Date | string;
};

export type DetectionConfig = {
  minSampleDays: number;
  minSampleCount: number;
  goodRatio: number;
  greatRatio: number;
  errorRatio: number;
  goodPercentile: number;
  greatPercentile: number;
  errorPercentile: number;
  errorDropVsMin: number;
  minPriceCents: number;
  version: number;
};

export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  minSampleDays: 10,
  minSampleCount: 20,
  goodRatio: 0.85,
  greatRatio: 0.7,
  errorRatio: 0.45,
  goodPercentile: 0.25,
  greatPercentile: 0.1,
  errorPercentile: 0.01,
  errorDropVsMin: 0.4,
  minPriceCents: 8000,
  version: 1,
};

export type DealReason = {
  version: number;
  ratio: number;
  percentileRank: number;
  robustZ: number;
  sampleDays: number;
  sampleCount: number;
  p01Cents: number;
  p10Cents: number;
  p25Cents: number;
  p50Cents: number;
  p90Cents: number;
  minCents: number;
  min2Cents: number;
  madCents: number;
  coldStart?: boolean;
  rules: string[];
};

export type DealClassification = {
  level: DealLevel;
  score: number;
  reason: DealReason;
};

export type ClassifyOptions = {
  /** Menor preço já visto antes desta observação. Default: stats.minCents. */
  previousMinCents?: number;
  /** Teto manual usado no score absoluto (e no cold start). */
  ceilingCents?: number | null;
  /** Quantas observações independentes confirmam o preço. */
  confirmations?: number;
};
