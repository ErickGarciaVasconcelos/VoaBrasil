import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIRPORTS } from "@ppa/db";
import { EmptyState } from "@/components/empty-state";
import { RouteCard } from "@/components/route-card";
import { SearchBox } from "@/components/search-box";
import { getAirports, getRoutesWithBestPrice } from "@/lib/queries";
import type { AirportView } from "@/lib/types";

export const dynamic = "force-dynamic";

const fallbackAirports: AirportView[] = AIRPORTS.map((airport) => ({
  iata: airport.iata,
  city: airport.city,
  name: airport.name,
  state: airport.state ?? null,
  country: airport.country,
}));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ origin: string }>;
}): Promise<Metadata> {
  const { origin } = await params;
  try {
    const routes = await getRoutesWithBestPrice();
    const route = routes.find((item) => item.origin.iata === origin.toUpperCase());
    if (!route) return { title: "Rotas não encontradas" };
    return {
      title: `Passagens baratas saindo de ${route.origin.city}`,
      description: `Ofertas de passagens aéreas saindo de ${route.origin.city} com preço comparado ao histórico de 90 dias. Veja destinos monitorados.`,
      alternates: { canonical: `/passagens/${route.origin.iata}` },
    };
  } catch {
    return { title: "Rotas monitoradas" };
  }
}

export default async function OriginPage({
  params,
}: {
  params: Promise<{ origin: string }>;
}) {
  const { origin } = await params;
  const iata = origin.toUpperCase();

  let routes = [] as Awaited<ReturnType<typeof getRoutesWithBestPrice>>;
  let airports = fallbackAirports;
  try {
    [routes, airports] = await Promise.all([
      getRoutesWithBestPrice(),
      getAirports(),
    ]);
  } catch (error) {
    console.error("[origem] erro ao carregar:", error);
  }

  const originRoutes = routes
    .filter((route) => route.origin.iata === iata)
    .sort(
      (a, b) =>
        (a.bestPriceCents ?? Number.POSITIVE_INFINITY) -
        (b.bestPriceCents ?? Number.POSITIVE_INFINITY),
    );
  if (originRoutes.length === 0) notFound();

  const originAirport = originRoutes[0].origin;

  return (
    <div className="container-page py-12 sm:py-16">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-teal">
          Início
        </Link>
        <span>/</span>
        <Link href="/passagens" className="hover:text-teal">
          Rotas
        </Link>
        <span>/</span>
        <span className="text-ink-soft">{originAirport.city}</span>
      </nav>

      <div className="mt-6 max-w-2xl">
        <p className="eyebrow">Saindo de {originAirport.iata}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          Passagens baratas saindo de {originAirport.city}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {originRoutes.length} destinos monitorados. Cada preço é comparado com
          a mediana dos últimos 90 dias da rota — não com o “preço de ontem”.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <SearchBox airports={airports} defaultOrigin={originAirport.iata} />
      </div>

      <div className="mt-10 grid gap-2.5 sm:grid-cols-2">
        {originRoutes.map((route) => (
          <RouteCard key={route.id} route={route} variant="destination" />
        ))}
      </div>

      {originRoutes.every((route) => route.offerCount === 0) ? (
        <div className="mt-10">
          <EmptyState
            title="Ainda sem ofertas publicadas nesta origem"
            description="As rotas já estão sendo monitoradas. Crie um alerta para receber assim que uma tarifa boa aparecer."
          />
        </div>
      ) : null}
    </div>
  );
}
