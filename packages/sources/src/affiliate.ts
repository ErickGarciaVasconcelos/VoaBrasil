export type AffiliateOptions = {
  baseUrl?: string;
  marker?: string;
  subId?: string;
};

/**
 * Normaliza um link de deep link e injeta marcador/subid de afiliado.
 * Nunca aceita protocolos diferentes de http/https.
 */
export function buildAffiliateUrl(
  link: string | null | undefined,
  options: AffiliateOptions = {},
): string | null {
  if (!link) return null;
  let url: URL;
  try {
    url = new URL(link, options.baseUrl ?? "https://www.aviasales.com");
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (options.marker && !url.searchParams.has("marker")) {
    url.searchParams.set("marker", options.marker);
  }
  if (options.subId && !url.searchParams.has("subid")) {
    url.searchParams.set("subid", options.subId);
  }
  return url.toString();
}

export function appendSubId(
  link: string,
  subId: string,
  param = "subid",
): string {
  try {
    const url = new URL(link);
    if (!url.searchParams.has(param)) url.searchParams.set(param, subId);
    return url.toString();
  } catch {
    return link;
  }
}
