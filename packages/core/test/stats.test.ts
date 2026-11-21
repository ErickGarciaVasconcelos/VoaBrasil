import { describe, expect, it } from "vitest";
import {
  computeStats,
  median,
  percentile,
  percentileRank,
  robustZ,
} from "../src/stats";

describe("median e percentil", () => {
  it("calcula mediana ímpar e par", () => {
    expect(median([500, 100, 300, 200, 400])).toBe(300);
    expect(median([100, 200, 300, 400])).toBe(250);
    expect(median([])).toBe(0);
  });

  it("interpola percentis linearmente", () => {
    const values = [100, 200, 300, 400, 500];
    expect(percentile(values, 0)).toBe(100);
    expect(percentile(values, 1)).toBe(500);
    expect(percentile(values, 0.1)).toBe(140);
    expect(percentile(values, 0.5)).toBe(300);
    expect(percentile(values, 0.9)).toBe(460);
  });
});

describe("computeStats", () => {
  it("calcula mediana, MAD, mínimo, máximo e amostra", () => {
    const stats = computeStats([
      { priceCents: 10000, observedAt: "2026-01-01" },
      { priceCents: 20000, observedAt: "2026-01-02" },
      { priceCents: 30000, observedAt: "2026-01-03" },
      { priceCents: 40000, observedAt: "2026-01-04" },
      { priceCents: 50000, observedAt: "2026-01-05" },
    ]);

    expect(stats).not.toBeNull();
    expect(stats?.p50Cents).toBe(30000);
    expect(stats?.madCents).toBe(10000);
    expect(stats?.minCents).toBe(10000);
    expect(stats?.maxCents).toBe(50000);
    expect(stats?.sampleDays).toBe(5);
    expect(stats?.sampleCount).toBe(5);
  });

  it("conta dias distintos, não observações", () => {
    const stats = computeStats([
      { priceCents: 10000, observedAt: "2026-01-01T10:00:00Z" },
      { priceCents: 12000, observedAt: "2026-01-01T18:00:00Z" },
      { priceCents: 11000, observedAt: "2026-01-02T10:00:00Z" },
    ]);
    expect(stats?.sampleDays).toBe(2);
    expect(stats?.sampleCount).toBe(3);
  });

  it("ignora preços inválidos e retorna null para série vazia", () => {
    expect(computeStats([])).toBeNull();
    const stats = computeStats([
      { priceCents: 0, observedAt: "2026-01-01" },
      { priceCents: -10, observedAt: "2026-01-02" },
      { priceCents: 15000, observedAt: "2026-01-03" },
    ]);
    expect(stats?.sampleCount).toBe(1);
  });
});

describe("percentileRank e robustZ", () => {
  it("ranqueia o menor preço como o melhor rank", () => {
    const sorted = [100, 200, 300, 400];
    expect(percentileRank(sorted, 100)).toBe(0.25);
    expect(percentileRank(sorted, 300)).toBe(0.75);
    expect(percentileRank(sorted, 999)).toBe(1);
  });

  it("usa escala alternativa quando MAD é zero", () => {
    const z = robustZ(8000, {
      p01Cents: 10000,
      p10Cents: 10000,
      p25Cents: 10000,
      p50Cents: 10000,
      p90Cents: 10000,
      minCents: 10000,
      min2Cents: 12000,
      maxCents: 10000,
      madCents: 0,
      sampleDays: 30,
      sampleCount: 100,
    });
    expect(z).toBe(-4);
  });
});
