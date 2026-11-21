export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function offerSlug(parts: {
  origin: string;
  destination: string;
  departureDate: string;
  carrier: string | null | undefined;
  hash: string;
}): string {
  const base = [
    parts.origin,
    parts.destination,
    parts.departureDate,
    parts.carrier ?? "voo",
    parts.hash.slice(0, 6),
  ]
    .map((part) => slugify(String(part)))
    .filter(Boolean)
    .join("-");
  return base.slice(0, 120);
}

export function tripBucket(days: number | null | undefined): string {
  if (days == null || days <= 0) return "oneway";
  if (days <= 3) return "1-3";
  if (days <= 7) return "4-7";
  if (days <= 14) return "8-14";
  if (days <= 21) return "15-21";
  return "22+";
}
