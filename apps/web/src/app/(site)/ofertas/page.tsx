import type { Metadata } from "next";
import Link from "next/link";
import { AIRPORTS } from "@ppa/db";
import { EmptyState } from "@/components/empty-state";
import { SearchBox } from "@/components/search-box";
import { TicketCard } from "@/components/ticket-card";
import { getAirports, getPublishedOffers } from "@/lib/queries";
import type { AirportView } from "@/lib/types";
import type { DealLevel } from "@ppa/core";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofertas de passagens baratas",
  description:
    "Ofertas de passagens aéreas selecionadas por preço comparado ao histórico de 90 dias da rota. Nacionais e internacionais.",
  alternates: { canonical: "/ofertas" },
};

const fallbackAirports: AirportView[] = AIRPORTS.map((airport) => ({
  iata: airport.iata,
  city: airport.city,
  name: airport.name,
  state: airport.state ?? null,
  country: airport.country,
}));

const filters: Array<{ label: string; value: DealLevel | null }> = [
  { label: "Todas", value: null },
  { label: "Boa", value: "good" },
  { label: "Ótima", value: "great" },
  { label: "Excepcional", value: "error" },
];

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawLevel = typeof params.level === "string" ? params.level : null;
  const level =
    rawLevel && ["good", "great", "error"].includes(rawLevel)
      ? (rawLevel as DealLevel)
      : undefined;

  let offers = [] as Awaited<ReturnType<typeof getPublishedOffers>>;
  let airports = fallbackAirports;
  try {
    [offers, airports] = await Promise.all([
      getPublishedOffers({ limit: 60, level }),
      getAirports(),
    ]);
  } catch (error) {
    console.error("[ofertas] erro ao carregar:", error);
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Radar de preços</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          Ofertas que passaram no filtro
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Cada tarifa abaixo foi comparada com a mediana dos últimos 90 dias da
          rota. Quanto maior o desconto, mais alto o nível.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <SearchBox airports={airports} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const active = filter.value === (level ?? null);
          return (
            <Link
              key={filter.label}
              href={filter.value ? `/ofertas?level=${filter.value}` : "/ofertas"}
              className={
                active
                  ? "rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper"
                  : "rounded-full border border-line bg-paper px-4 py-2 text-xs font-semibold text-ink-soft transition hover:border-ink/30"
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {offers.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer, index) => (
            <TicketCard
              key={offer.id}
              offer={offer}
              featured={index === 0 && !level}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="Nenhuma oferta com esse filtro"
            description="O motor está sempre coletando. Crie um alerta para receber quando aparecer uma tarifa dentro do seu limite."
          />
        </div>
      )}
    </div>
  );
}
