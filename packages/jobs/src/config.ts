import {
  DEFAULT_DETECTION_CONFIG,
  type DetectionConfig,
} from "@ppa/core";

export const TTL_HOURS = {
  good: 24,
  great: 12,
  error: 6,
} as const;

export function detectionConfig(): DetectionConfig {
  const minPrice = Number(process.env.MIN_PRICE_CENTS ?? 8000);
  return {
    ...DEFAULT_DETECTION_CONFIG,
    minPriceCents: Number.isFinite(minPrice) ? minPrice : 8000,
    version: Number(process.env.DETECTION_VERSION ?? 1),
  };
}

export function priceSourceId(): string {
  return (process.env.PRICE_SOURCE ?? "mock").trim().toLowerCase();
}

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function authSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

export function emailFrom(): string {
  return (
    process.env.EMAIL_FROM ?? "Voa Leve <alertas@voaleve.com.br>"
  );
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function travelpayoutsConfig() {
  return {
    token: process.env.TRAVELPAYOUTS_TOKEN?.trim() ?? "",
    marker: process.env.TRAVELPAYOUTS_MARKER?.trim() ?? "",
    baseUrl: process.env.TRAVELPAYOUTS_BASE_URL?.trim() || undefined,
  };
}

export function telegramConfig() {
  return {
    token: process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "",
    channelId: process.env.TELEGRAM_CHANNEL_ID?.trim() ?? "",
  };
}
