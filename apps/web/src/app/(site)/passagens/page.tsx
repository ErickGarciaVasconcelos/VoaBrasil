import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AIRPORTS } from "@ppa/db";
import { EmptyState } from "@/components/empty-state";
import { ArrowRightIcon } from "@/components/icons";
import { RouteCard } from "@/components/route-card";
import { SearchBox } from "@/components/search-box";
import { getAirports, getRoutesWithBestPrice } from "@/lib/queries";
import type { AirportView, RouteView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rotas monitoradas",
  description:
    "Veja todas as rotas de passagens aéreas monitoradas pelo Voa Leve, com o melhor preço publicado em cada uma.",
  alternates: { canonical: "/passagens" },
};

const fallbackAirports: AirportView[] = AIRPORTS.map((airport) => ({
  iata: airport.iata,
  city: airport.city,
  name: airport.name,
  state: airport.state ?? null,
  country: airport.country,
}));

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const origin = typeof params.origin === "string" ? params.origin.toUpperCase() : "";
  const destination =
    typeof params.destination === "string" ? params.destination.toUpperCase() : "";

  if (origin && destination) {
    redirect(`/passagens/${origin}/${destination}`);
  }
  if (origin) {
    redirect(`/passagens/${origin}`);
  }

  let routes: RouteView[] = [];
  let airports = fallbackAirports;
  try {
    [routes, airports] = await Promise.all([
      getRoutesWithBestPrice(),
      getAirports(),
    ]);
  } catch (error) {
    console.error("[passagens] erro ao carregar:", error);
  }

  const groups = new Map<string, { origin: AirportView; routes: RouteView[] }>();
  for (const route of routes) {
    const group = groups.get(route.origin.iata) ?? {
      origin: route.origin,
      routes: [],
    };
    group.routes.push(route);
    groups.set(route.origin.iata, group);
  }
  const orderedGroups = [...groups.values()].sort((a, b) =>
    a.origin.city.localeCompare(b.origin.city, "pt-BR"),
  );

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Rotas monitoradas</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          De onde você quer sair?
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Monitoramos rotas com volume e histórico suficientes para saber quando
          o preço está realmente fora da curva. Escolha uma origem ou busque
          direto.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <SearchBox airports={airports} />
      </div>

      {orderedGroups.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nenhuma rota ativa ainda"
            description="O motor está sendo configurado. Crie um alerta para ser avisado quando as primeiras rotas entrarem no radar."
          />
        </div>
      ) : (
        <div className="mt-12 space-y-12">
          {orderedGroups.map((group) => (
            <section key={group.origin.iata}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold">
                    Saindo de {group.origin.city}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {group.routes.length}{" "}
                    {group.routes.length === 1 ? "rota monitorada" : "rotas monitoradas"}
                  </p>
                </div>
                <Link
                  href={`/passagens/${group.origin.iata}`}
                  className="inline-flex items-center gap-1 text-sm font-bold text-teal"
                >
                  Ver todas
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {group.routes.slice(0, 6).map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
