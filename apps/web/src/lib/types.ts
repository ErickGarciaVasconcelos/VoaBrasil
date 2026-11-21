import type { DealLevel } from "@ppa/core";

export type AirportView = {
  iata: string;
  city: string;
  name: string;
  state: string | null;
  country: string;
};

export type OfferView = {
  id: string;
  routeId: string;
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  level: DealLevel;
  score: number;
  departureDate: string;
  returnDate: string | null;
  tripDays: number | null;
  carrier: string | null;
  stops: number;
  durationMinutes: number | null;
  bagsIncluded: boolean | null;
  selfTransfer: boolean;
  priceObservedAt: Date;
  publishedAt: Date | null;
  expiresAt: Date | null;
  coldStart: boolean;
  clickCount: number;
  medianCents: number | null;
  origin: AirportView;
  destination: AirportView;
};

export type RouteView = {
  id: string;
  origin: AirportView;
  destination: AirportView;
  monitorEnabled: boolean;
  priority: number;
  maxStops: number;
  maxDurationMinutes: number;
  ceilingCents: number | null;
  lastCollectedAt: Date | null;
  bestPriceCents: number | null;
  offerCount: number;
};

export type AdminOfferView = {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  level: DealLevel;
  status: string;
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate: string | null;
  carrier: string | null;
  createdAt: Date;
  publishedAt: Date | null;
  clickCount: number;
  coldStart: boolean;
};

export type AdminOfferDetail = AdminOfferView & {
  routeId: string;
  source: string;
  stops: number;
  durationMinutes: number | null;
  bagsIncluded: boolean | null;
  selfTransfer: boolean;
  deepLink: string | null;
  priceObservedAt: Date;
  expiresAt: Date | null;
  dedupHash: string;
  reason: Record<string, unknown> | null;
};

export type AdminStats = {
  published: number;
  drafts: number;
  clicks24h: number;
  subscribers: number;
  pendingNotifications: number;
  lastRun: {
    source: string;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    errors: number;
    message: string | null;
  } | null;
};

export type RoutePriceStats = {
  asOf: string;
  medianCents: number;
  minCents: number;
  sampleDays: number;
  sampleCount: number;
};

export type HistoryPoint = {
  day: string;
  priceCents: number;
};
