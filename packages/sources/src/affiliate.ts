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

/**
 * Link de resultados do Aviasales (parceiro Travelpayouts).
 * Formato documentado: ORIGEM + DDMM + DESTINO + DDMM +成年人.
 * Ex.: GRU2612REC05011 = GRU → REC, 26/12 a 05/01, 1 adulto.
 */
export function aviasalesSearchUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string | null,
  options: AffiliateOptions = {},
): string {
  const datePart = (value: string): string => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[3]}${match[2]}` : "";
  };
  const code = (value: string): string =>
    value.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);

  const originCode = code(origin);
  const destinationCode = code(destination);
  const depart = datePart(departureDate);
  if (!originCode || !destinationCode || !depart) {
    const home = "https://www.aviasales.com/";
    return buildAffiliateUrl(home, options) ?? home;
  }

  const back = returnDate ? datePart(returnDate) : "";
  const params = `${originCode}${depart}${destinationCode}${back}1`;
  const url = `https://www.aviasales.com/search/${params}`;
  return buildAffiliateUrl(url, options) ?? url;
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
