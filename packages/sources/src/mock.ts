import { aviasalesSearchUrl } from "./affiliate";
import type { PriceQuery, PriceSource, RawPrice } from "./types";

export type MockRouteProfile = {
  origin: string;
  destination: string;
  basePriceCents: number;
  baseTripDays: number;
  carrier: string;
  durationMinutes: number;
  stops: number;
};

function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Preço determinístico por rota + data de embarque + dia da observação.
 * Isso permite gerar histórico coerente e repetir a demonstração.
 */
export function mockPriceCents(
  profile: MockRouteProfile,
  departureDate: string,
  observedAt: Date,
): number {
  const seed = hashString(
    `${profile.origin}|${profile.destination}|${departureDate}`,
  );
  const random = mulberry32(seed);
  const month = Number(departureDate.slice(5, 7)) || 1;
  const season = 1 + 0.12 * Math.cos(((month - 1) / 12) * Math.PI * 2);
  const noise = 0.88 + random() * 0.28;
  let price = profile.basePriceCents * season * noise;

  const dayNumber = Math.floor(observedAt.getTime() / 86_400_000);
  const phase = hashString(`${profile.origin}${profile.destination}`) % 19;
  if (dayNumber % 19 === phase) price *= 0.66;

  const rarePhase = hashString(`${profile.destination}${profile.origin}`) % 43;
  if (dayNumber % 43 === rarePhase) price *= 0.52;

  return Math.max(1990, Math.round(price / 100) * 100);
}

function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function sampleDepartureDates(query: PriceQuery): string[] {
  const from = parseDate(query.departureFrom);
  const to = parseDate(query.departureTo);
  const dates: string[] = [];
  const cursor = new Date(from);
  for (let index = 0; index < 6 && cursor <= to; index += 1) {
    dates.push(formatDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return dates;
}

function googleFlightsLink(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
): string {
  const query = `Flights from ${origin} to ${destination} on ${departureDate} returning ${returnDate}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

export class MockSource implements PriceSource {
  readonly id = "mock";
  readonly dailyQuota = 100_000;

  constructor(
    private readonly profiles: MockRouteProfile[],
    private readonly now: () => Date = () => new Date(),
    private readonly marker = "",
  ) {}

  async search(query: PriceQuery): Promise<RawPrice[]> {
    const profile = this.profiles.find(
      (item) =>
        item.origin === query.origin &&
        item.destination === query.destination,
    );
    if (!profile) return [];

    const observedAt = this.now();
    return sampleDepartureDates(query).map((departureDate) => {
      const returnDate = addDays(departureDate, profile.baseTripDays);
      const priceCents = mockPriceCents(profile, departureDate, observedAt);
      return {
        source: this.id,
        origin: query.origin,
        destination: query.destination,
        carrier: profile.carrier,
        departureDate,
        returnDate,
        priceCents,
        currency: "BRL",
        stops: profile.stops,
        returnStops: profile.stops,
        durationMinutes: profile.durationMinutes,
        bagsIncluded: hashString(departureDate) % 2 === 0,
        selfTransfer: false,
        deepLink: aviasalesSearchUrl(
          query.origin,
          query.destination,
          departureDate,
          returnDate,
          { marker: this.marker },
        ),
        raw: { mock: true },
      } satisfies RawPrice;
    });
  }
}
