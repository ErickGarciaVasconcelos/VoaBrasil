import { describe, expect, it } from "vitest";
import { checkQuality } from "../src/quality";
import { offerSlug, slugify, tripBucket } from "../src/slug";
import { nextDigestAt } from "../src/time";

const options = {
  maxStops: 2,
  maxDurationMinutes: 2400,
  minPriceCents: 8000,
};

describe("checkQuality", () => {
  it("aceita voo razoável", () => {
    const result = checkQuality(
      {
        priceCents: 25000,
        stops: 1,
        durationMinutes: 900,
        selfTransfer: false,
        bagsIncluded: true,
        departureHour: 9,
      },
      options,
    );
    expect(result.ok).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("rejeita excesso de escalas, self-transfer e duração absurda", () => {
    const result = checkQuality(
      {
        priceCents: 25000,
        stops: 3,
        durationMinutes: 3000,
        selfTransfer: true,
        departureHour: 9,
      },
      options,
    );
    expect(result.ok).toBe(false);
    expect(result.reasons).toEqual([
      "too_many_stops",
      "self_transfer",
      "duration_too_long",
    ]);
  });

  it("marca voo noturno e ausência de bagagem sem rejeitar", () => {
    const result = checkQuality(
      {
        priceCents: 25000,
        stops: 0,
        durationMinutes: 600,
        bagsIncluded: false,
        departureHour: 3,
      },
      options,
    );
    expect(result.ok).toBe(true);
    expect(result.flags).toEqual(["red_eye", "no_bags"]);
  });

  it("rejeita preço abaixo do piso", () => {
    const result = checkQuality(
      { priceCents: 5000, stops: 0, departureHour: 9 },
      options,
    );
    expect(result.reasons).toContain("price_floor");
  });
});

describe("slugs e buckets", () => {
  it("remove acentos e caracteres especiais", () => {
    expect(slugify("São Paulo → Lisboa")).toBe("sao-paulo-lisboa");
    expect(slugify("  --Voo 123--  ")).toBe("voo-123");
  });

  it("monta slug de oferta estável", () => {
    expect(
      offerSlug({
        origin: "GRU",
        destination: "LIS",
        departureDate: "2026-03-10",
        carrier: "TP",
        hash: "abcdef123456",
      }),
    ).toBe("gru-lis-2026-03-10-tp-abcdef");
  });

  it("agrupa duração da viagem em faixas", () => {
    expect(tripBucket(null)).toBe("oneway");
    expect(tripBucket(2)).toBe("1-3");
    expect(tripBucket(5)).toBe("4-7");
    expect(tripBucket(10)).toBe("8-14");
    expect(tripBucket(18)).toBe("15-21");
    expect(tripBucket(30)).toBe("22+");
  });
});

describe("nextDigestAt", () => {
  it("agenda para as 18h de Brasília no mesmo dia", () => {
    const now = new Date("2026-01-10T20:00:00Z"); // 17h BRT
    expect(nextDigestAt(now).toISOString()).toBe("2026-01-10T21:00:00.000Z");
  });

  it("pula para o dia seguinte depois das 18h", () => {
    const now = new Date("2026-01-10T22:00:00Z"); // 19h BRT
    expect(nextDigestAt(now).toISOString()).toBe("2026-01-11T21:00:00.000Z");
  });
});
