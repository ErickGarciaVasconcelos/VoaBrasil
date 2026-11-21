import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIRPORTS } from "@ppa/db";
import { AlertForm } from "@/components/alert-form";
import { DestinationImage } from "@/components/destination-image";
import { EmptyState } from "@/components/empty-state";
import {
  ArrowUpRightIcon,
  ClockIcon,
  PlaneIcon,
  TrendingDownIcon,
} from "@/components/icons";
import { PriceChart } from "@/components/price-chart";
import { TicketCard } from "@/components/ticket-card";
import {
  formatBRL,
  formatDateRange,
  formatDateTime,
  relativeTime,
} from "@/lib/format";
import {
  getAirports,
  getPublishedOffers,
  getRoute,
  getRouteHistory,
  getRoutePriceStats,
} from "@/lib/queries";
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
  params: Promise<{ origin: string; destination: string }>;
}): Promise<Metadata> {
  const { origin, destination } = await params;
  try {
    const route = await getRoute(origin.toUpperCase(), destination.toUpperCase());
    if (!route) return { title: "Rota não encontrada" };
    const title = `Passagens de ${route.origin.city} para ${route.destination.city}`;
    return {
      title,
      description: `Ofertas de passagens de ${route.origin.city} (${route.origin.iata}) para ${route.destination.city} (${route.destination.iata}) com preço comparado ao histórico de 90 dias.`,
      alternates: {
        canonical: `/passagens/${route.origin.iata}/${route.destination.iata}`,
      },
    };
  } catch {
    return { title: "Rota monitorada" };
  }
}

const faqs = [
  {
    question: "Quando é o melhor momento para comprar?",
    answer:
      "Não existe uma regra universal. Em rotas internacionais, comprar com 2 a 5 meses de antecedência costuma dar mais opções; em domésticas, 3 a 8 semanas. O mais importante é comparar com o histórico da própria rota — é isso que o Voa Leve faz.",
  },
  {
    question: "O preço mostrado é garantido?",
    answer:
      "Não. O valor foi observado em um momento específico e pode mudar até o clique. Sempre confirme o preço final no site da companhia ou agência antes de pagar.",
  },
  {
    question: "Com que frequência os preços são atualizados?",
    answer:
      "As rotas prioritárias são coletadas várias vezes ao dia. Ofertas boas duram até 24 horas; ótimas, até 12; excepcionais, até 6. Depois disso, saem do ar automaticamente.",
  },
  {
    question: "O Voa Leve vende passagens?",
    answer:
      "Não. Somos um serviço de indicação. Você compra direto na companhia aérea ou agência. Podemos receber comissão de afiliado, sem custo extra para você.",
  },
];

export default async function RoutePage({
  params,
}: {
  params: Promise<{ origin: string; destination: string }>;
}) {
  const { origin, destination } = await params;
  const originIata = origin.toUpperCase();
  const destinationIata = destination.toUpperCase();

  let route = null;
  let offers = [] as Awaited<ReturnType<typeof getPublishedOffers>>;
  let history = [] as Awaited<ReturnType<typeof getRouteHistory>>;
  let stats = null as Awaited<ReturnType<typeof getRoutePriceStats>>;
  let airports = fallbackAirports;

  try {
    route = await getRoute(originIata, destinationIata);
    if (route) {
      [offers, history, stats, airports] = await Promise.all([
        getPublishedOffers({ routeId: route.id, limit: 12 }),
        getRouteHistory(route.id, 60),
        getRoutePriceStats(route.id),
        getAirports(),
      ]);
    }
  } catch (error) {
    console.error("[rota] erro ao carregar:", error);
  }

  if (!route) notFound();

  const best = offers[0];

  return (
    <div className="container-page py-10 sm:py-14">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-teal">
          Início
        </Link>
        <span>/</span>
        <Link href="/passagens" className="hover:text-teal">
          Rotas
        </Link>
        <span>/</span>
        <Link
          href={`/passagens/${route.origin.iata}`}
          className="hover:text-teal"
        >
          {route.origin.city}
        </Link>
        <span>/</span>
        <span className="text-ink-soft">{route.destination.city}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span>{route.origin.iata}</span>
            <PlaneIcon className="h-3.5 w-3.5 -rotate-12" />
            <span>{route.destination.iata}</span>
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Passagens de {route.origin.city} para {route.destination.city}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
            Acompanhamos esta rota e comparamos cada tarifa com a mediana dos
            últimos 90 dias. Quando o preço fica fora da curva, ele aparece aqui
            e vai para o canal de alertas.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
            {stats ? (
              <>
                <span className="rounded-full bg-paper px-3 py-1.5 font-semibold text-ink-soft ring-1 ring-line">
                  típico: {formatBRL(stats.medianCents)}
                </span>
                <span className="rounded-full bg-paper px-3 py-1.5 font-semibold text-ink-soft ring-1 ring-line">
                  mínimo: {formatBRL(stats.minCents)}
                </span>
                <span className="rounded-full bg-paper px-3 py-1.5 font-semibold text-ink-soft ring-1 ring-line">
                  {stats.sampleDays} dias de histórico
                </span>
              </>
            ) : (
              <span className="rounded-full bg-teal-soft px-3 py-1.5 font-semibold text-teal">
                histórico em formação
              </span>
            )}
            {route.lastCollectedAt ? (
              <span className="rounded-full bg-paper px-3 py-1.5 font-semibold text-ink-soft ring-1 ring-line">
                última coleta {relativeTime(route.lastCollectedAt)}
              </span>
            ) : null}
          </div>
        </div>

        <DestinationImage
          iata={route.destination.iata}
          city={route.destination.city}
          className="mb-4"
        />

        <div className="card p-6">
          {best ? (
            <>
              <p className="eyebrow">Melhor preço agora</p>
              <p className="mt-1 font-display text-5xl font-extrabold tracking-tight">
                {formatBRL(best.priceCents)}
              </p>
              <p className="mt-1 text-sm text-muted">
                ida e volta ·{" "}
                {formatDateRange(best.departureDate, best.returnDate)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {best.carrier ?? "Companhia a definir"} · visto{" "}
                {relativeTime(best.priceObservedAt)}
              </p>
              <a
                href={`/go/${best.id}?c=site`}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="btn btn-primary mt-4 w-full"
              >
                Ver preço atual
                <ArrowUpRightIcon className="h-4 w-4" />
              </a>
              <Link
                href={`/ofertas/${best.slug}`}
                className="mt-3 block text-center text-xs font-semibold text-teal underline underline-offset-4"
              >
                Ver detalhes da oferta
              </Link>
            </>
          ) : (
            <div>
              <p className="eyebrow">Sem oferta publicada</p>
              <p className="mt-2 font-display text-2xl font-bold">
                O radar está ligado
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Nenhuma tarifa passou no filtro nos últimos dias. Crie um alerta
                e avisamos quando aparecer.
              </p>
              <Link href="#alerta" className="btn btn-ink mt-4 w-full">
                Criar alerta desta rota
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Histórico</p>
            <h2 className="mt-1 font-display text-2xl font-bold">
              Preço da rota nos últimos 60 dias
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <TrendingDownIcon className="h-4 w-4 text-teal" />
            menor preço diário observado
          </span>
        </div>
        <div className="mt-5">
          <PriceChart points={history} id="route-chart" />
        </div>
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Ofertas publicadas</p>
            <h2 className="mt-1 font-display text-3xl font-bold">
              {route.origin.city} → {route.destination.city}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <ClockIcon className="h-4 w-4" />
            ofertas expiram automaticamente
          </span>
        </div>

        {offers.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <TicketCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="Nenhuma oferta ativa nesta rota"
              description="Assim que uma tarifa passar no filtro de 90 dias, ela aparece aqui e vai para os alertas."
              actionHref="#alerta"
              actionLabel="Criar alerta desta rota"
            />
          </div>
        )}
      </section>

      <section id="alerta" className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="eyebrow">Alerta desta rota</p>
          <h2 className="mt-1 font-display text-3xl font-bold">
            Avise quando {route.destination.city} ficar barato
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Defina seu teto de preço e o período. Você recebe um e-mail quando
            uma oferta real aparecer dentro do limite — e pode cancelar em um
            clique.
          </p>
          <div className="mt-5 rounded-2xl border border-line bg-paper p-4 text-xs leading-5 text-muted">
            <p className="font-bold text-ink">Como funciona o alerta</p>
            <p className="mt-1">
              Double opt-in: você confirma o e-mail antes de entrar na lista.
              Ofertas boas vão no resumo das 18h; ótimas e excepcionais saem na
              hora.
            </p>
          </div>
        </div>
        <AlertForm
          airports={airports}
          defaultOrigin={route.origin.iata}
          defaultDestination={route.destination.iata}
          fixedRoute
        />
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-bold">Perguntas frequentes</h2>
        <div className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
          {faqs.map((faq) => (
            <details key={faq.question} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                {faq.question}
                <span className="text-lg text-teal transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
