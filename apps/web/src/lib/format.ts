export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatBRLExact(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${value}T12:00:00Z`))
    .replace(".", "");
}

export function formatDateShort(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${value}T12:00:00Z`))
    .replace(".", "");
}

export function formatDateRange(
  departure: string,
  returnDate: string | null,
): string {
  if (!returnDate) return formatDateShort(departure);
  return `${formatDateShort(departure)} – ${formatDateShort(returnDate)}`;
}

export function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}min`;
}

export function stopsLabel(stops: number): string {
  if (stops <= 0) return "Direto";
  if (stops === 1) return "1 escala";
  return `${stops} escalas`;
}

export function levelLabel(level: string): string {
  if (level === "error") return "Excepcional";
  if (level === "great") return "Ótima";
  return "Boa";
}

export function levelEmoji(level: string): string {
  if (level === "error") return "🚨";
  if (level === "great") return "🔥";
  return "🟢";
}

export function relativeTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (diffMinutes < -1) {
    const ahead = Math.abs(diffMinutes);
    if (ahead < 60) return `em ${ahead} min`;
    const hours = Math.round(ahead / 60);
    if (hours < 24) return `em ${hours}h`;
    return `em ${Math.round(hours / 24)}d`;
  }
  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.round(hours / 24);
  return `há ${days}d`;
}

export function formatMonth(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 7)}-01T12:00:00Z`));
}
