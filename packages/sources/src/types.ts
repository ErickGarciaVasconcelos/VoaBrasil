export type PriceQuery = {
  origin: string;
  destination: string;
  departureFrom: string;
  departureTo: string;
  returnFrom?: string;
  returnTo?: string;
  currency?: string;
  limit?: number;
};

export type RawPrice = {
  source: string;
  origin: string;
  destination: string;
  carrier: string | null;
  departureDate: string;
  returnDate: string | null;
  priceCents: number;
  currency: string;
  stops: number;
  returnStops: number | null;
  durationMinutes: number | null;
  bagsIncluded: boolean | null;
  selfTransfer: boolean;
  deepLink: string | null;
  raw?: unknown;
};

export interface PriceSource {
  readonly id: string;
  readonly dailyQuota: number;
  search(query: PriceQuery): Promise<RawPrice[]>;
}
