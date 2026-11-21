import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  formatBRL,
  formatDateRange,
  relativeTime,
  stopsLabel,
} from "@/lib/format";
import type { OfferView } from "@/lib/types";
import { ArrowRightIcon, PlaneIcon } from "./icons";
import { LevelBadge } from "./level-badge";

export function TicketCard({
  offer,
  featured = false,
}: {
  offer: OfferView;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/ofertas/${offer.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-paper transition duration-300 hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_20px_45px_-24px_rgba(11,27,43,0.4)]",
        featured && "sm:col-span-2",
      )}
    >
      {featured ? (
        <span className="absolute right-5 top-0 rounded-b-lg bg-sun px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
          melhor de hoje
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            <span>{offer.origin.iata}</span>
            <PlaneIcon className="h-3.5 w-3.5 -rotate-12 text-teal" />
            <span>{offer.destination.iata}</span>
          </p>
          <h3 className="mt-1 truncate font-display text-lg font-bold tracking-tight">
            {offer.origin.city} → {offer.destination.city}
          </h3>
        </div>
        <LevelBadge level={offer.level} className="shrink-0" />
      </div>

      <div className="relative mx-5 border-t border-dashed border-line">
        <span className="ticket-notch ticket-notch-left" aria-hidden />
        <span className="ticket-notch ticket-notch-right" aria-hidden />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              ida e volta
            </p>
            <p
              className={cn(
                "font-display font-extrabold tracking-tight",
                featured ? "text-4xl" : "text-3xl",
              )}
            >
              {formatBRL(offer.priceCents)}
            </p>
          </div>
          <div className="text-right text-xs leading-5 text-ink-soft">
            <p className="font-semibold">
              {formatDateRange(offer.departureDate, offer.returnDate)}
            </p>
            <p>{offer.tripDays ? `${offer.tripDays} dias` : "só ida"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          <span className="rounded-full bg-cream px-2.5 py-1 font-medium">
            {offer.carrier ?? "Cia a definir"}
          </span>
          <span className="rounded-full bg-cream px-2.5 py-1 font-medium">
            {stopsLabel(offer.stops)}
          </span>
          {offer.medianCents && offer.priceCents < offer.medianCents ? (
            <span className="rounded-full bg-teal-soft px-2.5 py-1 font-bold text-teal">
              -{Math.round((1 - offer.priceCents / offer.medianCents) * 100)}%
              vs. típico
            </span>
          ) : null}
          {offer.bagsIncluded === false ? (
            <span className="rounded-full bg-sun/20 px-2.5 py-1 font-medium text-[#8a5a00]">
              sem bagagem
            </span>
          ) : null}
          {offer.coldStart ? (
            <span className="rounded-full bg-teal-soft px-2.5 py-1 font-medium text-teal">
              prévia
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">
            visto {relativeTime(offer.priceObservedAt)}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-coral">
            Ver oferta
            <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
