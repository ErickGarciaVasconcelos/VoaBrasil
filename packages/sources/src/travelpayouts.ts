import { buildAffiliateUrl } from "./affiliate";
import type { PriceQuery, PriceSource, RawPrice } from "./types";

type TravelpayoutsItem = {
  origin?: string;
  destination?: string;
  origin_airport?: string;
  destination_airport?: string;
  price?: number;
  airline?: string;
  flight_number?: string;
  departure_at?: string;
  return_at?: string;
  transfers?: number;
  return_transfers?: number;
  duration?: number;
  duration_to?: number;
  duration_back?: number;
  link?: string;
};

type TravelpayoutsResponse = {
  success?: boolean;
  data?: TravelpayoutsItem[];
  currency?: string;
  error?: string;
};

export type TravelpayoutsOptions = {
  token: string;
  marker?: string;
  baseUrl?: string;
  currency?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Adaptador da Data API do Travelpayouts (Aviasales).
 * Confira os termos atuais de cache/exibição antes de usar em produção.
 */
export class TravelpayoutsSource implements PriceSource {
  readonly id = "travelpayouts";
  readonly dailyQuota = 500;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: TravelpayoutsOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  async search(query: PriceQuery): Promise<RawPrice[]> {
    const url = new URL(
      "https://api.travelpayouts.com/aviasales/v3/prices_for_dates",
    );
    url.searchParams.set("origin", query.origin);
    url.searchParams.set("destination", query.destination);
    url.searchParams.set("departure_at", query.departureFrom.slice(0, 7));
    url.searchParams.set(
      "return_at",
      (query.returnFrom ?? addDays(query.departureFrom, 10)).slice(0, 7),
    );
    url.searchParams.set("unique", "false");
    url.searchParams.set("sorting", "price");
    url.searchParams.set("direct", "false");
    url.searchParams.set("one_way", "false");
    url.searchParams.set("currency", (query.currency ?? this.options.currency ?? "brl").toLowerCase());
    url.searchParams.set("limit", String(query.limit ?? 30));
    url.searchParams.set("page", "1");
    url.searchParams.set("token", this.options.token);

    const response = await this.fetchImpl(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Travelpayouts respondeu ${response.status}: ${body.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as TravelpayoutsResponse;
    if (payload.success === false) {
      throw new Error(
        `Travelpayouts retornou erro: ${payload.error ?? "desconhecido"}`,
      );
    }

    const currency = (payload.currency ?? "BRL").toUpperCase();
    return (payload.data ?? [])
      .filter((item) => item.price && item.departure_at)
      .map((item) => {
        const departureDate = item.departure_at!.slice(0, 10);
        const returnDate = item.return_at?.slice(0, 10) ?? null;
        return {
          source: this.id,
          origin: item.origin ?? query.origin,
          destination: item.destination ?? query.destination,
          carrier: item.airline ?? null,
          departureDate,
          returnDate,
          priceCents: Math.round(item.price! * 100),
          currency,
          stops: item.transfers ?? 0,
          returnStops: item.return_transfers ?? null,
          durationMinutes: item.duration ?? item.duration_to ?? null,
          bagsIncluded: null,
          selfTransfer: false,
          deepLink: buildAffiliateUrl(item.link, {
            baseUrl: this.options.baseUrl,
            marker: this.options.marker,
          }),
          raw: item,
        } satisfies RawPrice;
      });
  }
}
