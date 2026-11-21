import Link from "next/link";
import { formatBRL } from "@/lib/format";
import type { RouteView } from "@/lib/types";
import { ArrowRightIcon, PlaneIcon } from "./icons";

export function RouteCard({
  route,
  variant = "full",
}: {
  route: RouteView;
  variant?: "full" | "destination";
}) {
  return (
    <Link
      href={`/passagens/${route.origin.iata}/${route.destination.iata}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 transition duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-md"
    >
      <div className="flex min-w-0 items-center gap-3">
        {variant === "full" ? (
          <span className="flex shrink-0 items-center gap-1 rounded-xl bg-cream px-2.5 py-2 font-display text-[11px] font-bold">
            {route.origin.iata}
            <PlaneIcon className="h-3 w-3 -rotate-12 text-teal" />
            {route.destination.iata}
          </span>
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream font-display text-[11px] font-bold">
            {route.destination.iata}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {variant === "full"
              ? `${route.origin.city} → ${route.destination.city}`
              : route.destination.city}
          </p>
          <p className="truncate text-xs text-muted">
            {variant === "full"
              ? route.destination.name
              : route.destination.name}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted">
            a partir de
          </p>
          <p className="font-display text-lg font-bold text-teal">
            {route.bestPriceCents ? formatBRL(route.bestPriceCents) : "—"}
          </p>
        </div>
        <ArrowRightIcon className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-coral" />
      </div>
    </Link>
  );
}
