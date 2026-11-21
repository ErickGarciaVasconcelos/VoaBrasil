import { describe, expect, it } from "vitest";
import { classifyDeal, coldStartDeal } from "../src/detect";
import type { BucketStats } from "../src/types";

const stats: BucketStats = {
  p01Cents: 10000,
  p10Cents: 20000,
  p25Cents: 30000,
  p50Cents: 40000,
  p90Cents: 60000,
  minCents: 10000,
  min2Cents: 12000,
  maxCents: 80000,
  madCents: 5000,
  sampleDays: 30,
  sampleCount: 100,
};

describe("classifyDeal", () => {
  it("não classifica preço comum", () => {
    expect(classifyDeal(38000, stats)).toBeNull();
    expect(classifyDeal(40000, stats)).toBeNull();
  });

  it("classifica boa promoção por razão", () => {
    const result = classifyDeal(32000, stats);
    expect(result?.level).toBe("good");
    expect(result?.reason.rules).toContain("ratio<=0.85");
  });

  it("classifica ótima promoção por p10", () => {
    const result = classifyDeal(26000, stats);
    expect(result?.level).toBe("great");
    expect(result?.score).toBeGreaterThan(0);
  });

  it("só classifica tarifa excepcional com duas confirmações", () => {
    const withoutConfirmation = classifyDeal(9000, stats, undefined, {
      previousMinCents: 20000,
      confirmations: 1,
    });
    expect(withoutConfirmation?.level).toBe("great");

    const confirmed = classifyDeal(9000, stats, undefined, {
      previousMinCents: 20000,
      confirmations: 2,
    });
    expect(confirmed?.level).toBe("error");
    expect(confirmed?.reason.rules).toContain("confirmed>=2");
  });

  it("exige queda de 40% contra o mínimo anterior", () => {
    const result = classifyDeal(9500, stats, undefined, {
      previousMinCents: 12000,
      confirmations: 2,
    });
    expect(result?.level).not.toBe("error");
  });

  it("respeita piso de sanidade", () => {
    expect(classifyDeal(7000, stats)).toBeNull();
  });

  it("não classifica sem amostra mínima", () => {
    expect(
      classifyDeal(20000, { ...stats, sampleDays: 3, sampleCount: 5 }),
    ).toBeNull();
  });

  it("ordena score: preço menor tem score maior", () => {
    const cheap = classifyDeal(26000, stats);
    const mid = classifyDeal(32000, stats);
    expect(cheap!.score).toBeGreaterThan(mid!.score);
  });
});

describe("coldStartDeal", () => {
  it("usa teto manual quando não há histórico", () => {
    const result = coldStartDeal(28000, 40000);
    expect(result?.level).toBe("great");
    expect(result?.reason.coldStart).toBe(true);
  });

  it("classifica como boa quando está apenas abaixo do teto", () => {
    const result = coldStartDeal(36000, 40000);
    expect(result?.level).toBe("good");
  });

  it("ignora preço acima do teto ou rota sem teto", () => {
    expect(coldStartDeal(42000, 40000)).toBeNull();
    expect(coldStartDeal(10000, null)).toBeNull();
  });
});
