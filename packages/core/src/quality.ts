export type QualityInput = {
  priceCents: number;
  stops: number;
  durationMinutes?: number | null;
  selfTransfer?: boolean | null;
  bagsIncluded?: boolean | null;
  departureHour?: number | null;
};

export type QualityOptions = {
  maxStops: number;
  maxDurationMinutes: number;
  minPriceCents: number;
  allowSelfTransfer?: boolean;
};

export type QualityResult = {
  ok: boolean;
  reasons: string[];
  flags: string[];
};

/**
 * Filtro de qualidade. Rejeita o que não deveria virar oferta e marca
 * características que precisam aparecer no título (voo noturno, sem bagagem).
 */
export function checkQuality(
  input: QualityInput,
  options: QualityOptions,
): QualityResult {
  const reasons: string[] = [];
  const flags: string[] = [];

  if (!Number.isFinite(input.priceCents) || input.priceCents < options.minPriceCents) {
    reasons.push("price_floor");
  }
  if (input.stops > options.maxStops) {
    reasons.push("too_many_stops");
  }
  if (input.selfTransfer && !options.allowSelfTransfer) {
    reasons.push("self_transfer");
  }
  if (
    input.durationMinutes != null &&
    input.durationMinutes > options.maxDurationMinutes
  ) {
    reasons.push("duration_too_long");
  }
  if (
    input.departureHour != null &&
    input.departureHour >= 0 &&
    input.departureHour < 5
  ) {
    flags.push("red_eye");
  }
  if (input.bagsIncluded === false) {
    flags.push("no_bags");
  }

  return { ok: reasons.length === 0, reasons, flags };
}
