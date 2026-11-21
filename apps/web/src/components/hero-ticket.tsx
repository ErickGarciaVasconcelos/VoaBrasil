import {
  formatBRL,
  formatDateRange,
  formatDateTime,
  relativeTime,
  stopsLabel,
} from "@/lib/format";
import type { OfferView } from "@/lib/types";
import { PlaneIcon } from "./icons";

export function HeroTicket({ offer }: { offer?: OfferView }) {
  const origin = offer?.origin;
  const destination = offer?.destination;
  const discount =
    offer?.medianCents && offer.priceCents < offer.medianCents
      ? Math.round((1 - offer.priceCents / offer.medianCents) * 100)
      : null;

  return (
    <div className="relative mx-auto w-full max-w-md rotate-1">
      <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-sun/40 blur-2xl" />
      <div className="absolute -bottom-8 -right-4 h-36 w-36 rounded-full bg-teal/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-ink/10 bg-ink text-paper shadow-[0_35px_70px_-35px_rgba(11,27,43,0.8)]">
        <div className="flex items-center justify-between border-b border-dashed border-paper/20 px-6 py-4">
          <span className="font-display text-lg font-bold tracking-tight">
            voa leve<span className="text-coral">.</span>
          </span>
          <span className="rounded-full bg-paper/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-paper/60">
            boarding pass
          </span>
        </div>

        <div className="px-6 py-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-paper/40">
                de
              </p>
              <p className="font-display text-4xl font-extrabold leading-none">
                {origin?.iata ?? "GRU"}
              </p>
              <p className="mt-1 text-xs text-paper/60">
                {origin?.city ?? "São Paulo"}
              </p>
            </div>

            <div className="flex flex-col items-center gap-1 text-paper/40">
              <PlaneIcon className="h-5 w-5 -rotate-12" />
              <span className="w-16 border-t border-dashed border-paper/30" />
            </div>

            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-paper/40">
                para
              </p>
              <p className="font-display text-4xl font-extrabold leading-none">
                {destination?.iata ?? "LIS"}
              </p>
              <p className="mt-1 text-xs text-paper/60">
                {destination?.city ?? "Lisboa"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-paper/10 pt-5 text-xs">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-paper/40">
                datas
              </p>
              <p className="mt-1 font-semibold">
                {offer
                  ? formatDateRange(offer.departureDate, offer.returnDate)
                  : "10 – 20 mar"}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-paper/40">
                voo
              </p>
              <p className="mt-1 font-semibold">
                {offer?.carrier ?? "TP"} ·{" "}
                {offer ? stopsLabel(offer.stops) : "Direto"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-[0.18em] text-paper/40">
                preço
              </p>
              <p className="mt-0.5 font-display text-xl font-extrabold text-sun">
                {offer ? formatBRL(offer.priceCents) : "R$ 3.290"}
              </p>
            </div>
          </div>
        </div>

        <div className="relative border-t border-dashed border-paper/20 px-6 py-4">
          <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-cream" />
          <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-cream" />
          <div className="flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.18em] text-paper/40">
            <span>tarifa observada</span>
            <span>
              {offer
                ? formatDateTime(offer.priceObservedAt)
                : "hoje, 14:32"}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 rotate-[-6deg] rounded-xl border border-line bg-paper px-3.5 py-2 text-xs font-bold shadow-lg">
        <span className="text-coral">↓</span>{" "}
        {discount
          ? `${discount}% abaixo do preço típico`
          : "comparado com 90 dias de histórico"}
      </div>

      {offer ? (
        <span className="absolute -right-2 top-20 rotate-6 rounded-full border border-line bg-paper px-3 py-1 text-[10px] font-bold text-ink shadow-md">
          visto {relativeTime(offer.priceObservedAt)}
        </span>
      ) : null}
    </div>
  );
}
