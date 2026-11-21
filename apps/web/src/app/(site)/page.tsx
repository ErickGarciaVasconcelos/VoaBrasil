import Link from "next/link";
import { AIRPORTS } from "@ppa/db";
import { AlertForm } from "@/components/alert-form";
import { EmptyState } from "@/components/empty-state";
import { HeroTicket } from "@/components/hero-ticket";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  PlaneIcon,
  ShieldIcon,
  TelegramIcon,
  TrendingDownIcon,
} from "@/components/icons";
import { SearchBox } from "@/components/search-box";
import { TicketCard } from "@/components/ticket-card";
import { formatBRL } from "@/lib/format";
import {
  getAirports,
  getPublishedOffers,
  getRoutesWithBestPrice,
} from "@/lib/queries";
import { site } from "@/lib/site";
import type { AirportView, OfferView, RouteView } from "@/lib/types";

export const dynamic = "force-dynamic";

const fallbackAirports: AirportView[] = AIRPORTS.map((airport) => ({
  iata: airport.iata,
  city: airport.city,
  name: airport.name,
  state: airport.state ?? null,
  country: airport.country,
}));

async function loadHome(): Promise<{
  offers: OfferView[];
  routes: RouteView[];
  airports: AirportView[];
  dbReady: boolean;
}> {
  try {
    const [offers, routes, airports] = await Promise.all([
      getPublishedOffers({ limit: 7 }),
      getRoutesWithBestPrice(),
      getAirports(),
    ]);
    return { offers, routes, airports, dbReady: true };
  } catch (error) {
    console.error("[home] banco indisponível:", error);
    return {
      offers: [],
      routes: [],
      airports: fallbackAirports,
      dbReady: false,
    };
  }
}

function RouteRow({ route }: { route: RouteView }) {
  return (
    <Link
      href={`/passagens/${route.origin.iata}/${route.destination.iata}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper px-4 py-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-md"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream font-display text-[11px] font-bold">
          {route.origin.iata}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {route.origin.city} → {route.destination.city}
          </p>
          <p className="text-xs text-muted">
            {route.offerCount}{" "}
            {route.offerCount === 1 ? "oferta publicada" : "ofertas publicadas"}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[9px] font-bold uppercase tracking-wide text-muted">
          a partir de
        </p>
        <p className="font-display text-lg font-bold text-teal">
          {route.bestPriceCents ? formatBRL(route.bestPriceCents) : "—"}
        </p>
      </div>
    </Link>
  );
}

const steps = [
  {
    title: "Coletamos o preço",
    text: "Rotas prioritárias são consultadas várias vezes ao dia. Cada tarifa vira um ponto no histórico da rota.",
  },
  {
    title: "Comparamos com 90 dias",
    text: "Usamos mediana e percentis, não média. Uma tarifa-erro isolada não distorce a referência.",
  },
  {
    title: "Filtramos e publicamos",
    text: "Escalas absurdas, durações inviáveis e preço fora da realidade ficam de fora. O resto vira alerta.",
  },
];

export default async function HomePage() {
  const { offers, routes, airports, dbReady } = await loadHome();
  const featured = offers[0];
  const rest = offers.slice(1, 7);
  const routesWithPrice = routes
    .filter((route) => route.bestPriceCents != null)
    .sort(
      (a, b) =>
        (a.bestPriceCents ?? Number.POSITIVE_INFINITY) -
        (b.bestPriceCents ?? Number.POSITIVE_INFINITY),
    )
    .slice(0, 6);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grain pointer-events-none absolute inset-0 -z-10" />
        <div className="container-page grid gap-14 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div className="animate-fade-up">
            <p className="eyebrow flex items-center gap-2">
              <span className="h-px w-8 bg-teal" />
              Alertas de passagens · Brasil
            </p>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              Seu próximo destino por um preço que{" "}
              <span className="relative inline-block text-coral">
                faz sentido
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  viewBox="0 0 220 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9C45 3 105 2 218 6"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.3"
                  />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-soft">
              A gente compara cada tarifa com o histórico real da rota. Se não
              for realmente barato, não entra. Simples assim.
            </p>

            <div className="mt-7 max-w-2xl">
              <SearchBox airports={airports} />
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-teal" />
                Preço comparado com histórico
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-teal" />
                Sem taxa de serviço
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-teal" />
                Link direto para a companhia
              </span>
            </div>
          </div>

          <div className="lg:pl-6">
            <HeroTicket offer={featured} />
          </div>
        </div>
      </section>

      {!dbReady && process.env.NODE_ENV !== "production" ? (
        <div className="container-page">
          <div className="rounded-2xl border border-sun/40 bg-sun/15 px-5 py-4 text-sm text-ink-soft">
            <strong className="font-bold text-ink">
              Banco ainda não inicializado.
            </strong>{" "}
            Rode{" "}
            <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs">
              npm run demo
            </code>{" "}
            para criar o histórico de demonstração e popular o site.
          </div>
        </div>
      ) : null}

      <section className="container-page mt-16 sm:mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Radar de preços</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              As melhores de hoje
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Preço comparado com a mediana dos últimos 90 dias da rota. Quanto
              maior o desconto, mais alto o nível.
            </p>
          </div>
          <Link href="/ofertas" className="btn btn-outline">
            Ver todas
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {offers.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured ? <TicketCard offer={featured} featured /> : null}
            {rest.map((offer) => (
              <TicketCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState />
          </div>
        )}
      </section>

      <section className="container-page mt-24 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="eyebrow">Rotas monitoradas</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            Onde estamos de olho
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted">
            Não monitoramos o mundo inteiro. Escolhemos rotas com volume e
            histórico suficientes para saber quando o preço está fora da curva.
          </p>
          <Link href="/passagens" className="btn btn-ink mt-6">
            Explorar todas as rotas
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-2.5">
          {routesWithPrice.map((route) => (
            <RouteRow key={route.id} route={route} />
          ))}
          {routesWithPrice.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-paper/60 p-8 text-center text-sm text-muted">
              Nenhuma rota com oferta publicada ainda. Crie um alerta para ser
              avisado quando a primeira aparecer.
            </div>
          ) : null}
        </div>
      </section>

      <section className="container-page mt-24">
        <div className="rounded-[32px] border border-line bg-paper p-6 sm:p-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Sem achismo</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              Como a gente decide o que é barato
            </h2>
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title}>
                <span className="font-display text-4xl font-extrabold text-line">
                  0{index + 1}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/como-funciona"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-bold text-teal"
          >
            Entender a metodologia
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="container-page mt-20">
        <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-10 text-paper sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="grain pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sun">
              Canal gratuito
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              A oferta chega antes de todo mundo.
            </h2>
            <p className="mt-3 text-sm leading-6 text-paper/70">
              Receba as melhores tarifas no Telegram. Sem spam, sem conversa
              fiada — só o que passou no filtro.
            </p>
          </div>
          <a
            href={site.telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary relative mt-6 lg:mt-0"
          >
            <TelegramIcon className="h-4 w-4" />
            Entrar no canal
          </a>
        </div>
      </section>

      <section className="container-page mt-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow">Alerta sob medida</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            Só avise quando o preço estiver bom.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted">
            Você define a rota, o período e o teto de preço. A gente avisa
            quando uma oferta real aparecer dentro do seu limite.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink-soft">
            <li className="flex items-start gap-2.5">
              <TrendingDownIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              Preço comparado com 90 dias de histórico
            </li>
            <li className="flex items-start gap-2.5">
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              Ofertas excepcionais saem na hora; boas vão no resumo diário
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              Double opt-in e cancelamento em um clique
            </li>
            <li className="flex items-start gap-2.5">
              <PlaneIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              Sem vender passagem: você compra direto na companhia ou agência
            </li>
          </ul>
        </div>
        <AlertForm airports={airports} />
      </section>
    </>
  );
}
