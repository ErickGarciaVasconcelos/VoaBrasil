import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIRPORTS } from "@ppa/db";
import { AlertForm } from "@/components/alert-form";
import { DestinationImage } from "@/components/destination-image";
import {
  ArrowUpRightIcon,
  BaggageIcon,
  ClockIcon,
  PlaneIcon,
  ShieldIcon,
  TrendingDownIcon,
} from "@/components/icons";
import { LevelBadge } from "@/components/level-badge";
import { PriceChart } from "@/components/price-chart";
import { TicketCard } from "@/components/ticket-card";
import {
  formatBRL,
  formatDate,
  formatDateTime,
  formatDuration,
  relativeTime,
  stopsLabel,
} from "@/lib/format";
import {
  getAirports,
  getOfferBySlug,
  getRelatedOffers,
  getRouteHistory,
} from "@/lib/queries";
import { affiliateDisclosure } from "@/lib/site";
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const offer = await getOfferBySlug(slug);
    if (!offer) return { title: "Oferta não encontrada" };
    const title = `${offer.origin.city} → ${offer.destination.city} por ${formatBRL(offer.priceCents)}`;
    return {
      title,
      description: `Passagem de ${offer.origin.city} para ${offer.destination.city} por ${formatBRL(offer.priceCents)} ida e volta. Preço observado em ${formatDateTime(offer.priceObservedAt)} e comparado com 90 dias de histórico.`,
      alternates: { canonical: `/ofertas/${offer.slug}` },
      openGraph: { title, description: `Oferta monitorada pelo Voa Leve.` },
    };
  } catch {
    return { title: "Oferta de passagem" };
  }
}

export default async function OfferPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let offer = null;
  let related = [] as Awaited<ReturnType<typeof getRelatedOffers>>;
  let history = [] as Awaited<ReturnType<typeof getRouteHistory>>;
  let airports = fallbackAirports;

  try {
    offer = await getOfferBySlug(slug);
    if (offer) {
      [related, history, airports] = await Promise.all([
        getRelatedOffers(offer.routeId, offer.id, 3),
        getRouteHistory(offer.routeId, 60),
        getAirports(),
      ]);
    }
  } catch (error) {
    console.error("[oferta] erro ao carregar:", error);
  }

  if (!offer) notFound();

  const discount =
    offer.medianCents && offer.priceCents < offer.medianCents
      ? Math.round((1 - offer.priceCents / offer.medianCents) * 100)
      : null;

  const breadcrumbJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "/" },
      { "@type": "ListItem", position: 2, name: "Ofertas", item: "/ofertas" },
      {
        "@type": "ListItem",
        position: 3,
        name: `${offer.origin.city} → ${offer.destination.city}`,
        item: `/ofertas/${offer.slug}`,
      },
    ],
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
      />

      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-teal">
          Início
        </Link>
        <span>/</span>
        <Link href="/ofertas" className="hover:text-teal">
          Ofertas
        </Link>
        <span>/</span>
        <span className="text-ink-soft">
          {offer.origin.city} → {offer.destination.city}
        </span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={offer.level} />
            {offer.coldStart ? (
              <span className="rounded-full bg-teal-soft px-2.5 py-1 text-[11px] font-bold text-teal">
                prévia · histórico em formação
              </span>
            ) : null}
            {offer.medianCents ? (
              <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
                típico: {formatBRL(offer.medianCents)}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            {offer.origin.city} → {offer.destination.city}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {formatDate(offer.departureDate)}
            {offer.returnDate ? ` – ${formatDate(offer.returnDate)}` : ""} ·{" "}
            {offer.tripDays ? `${offer.tripDays} dias` : "só ida"} ·{" "}
            {offer.carrier ?? "companhia a definir"}
          </p>

          <div className="card relative mt-7 overflow-hidden p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                  ida e volta
                </p>
                <p className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
                  {formatBRL(offer.priceCents)}
                </p>
                {discount ? (
                  <p className="mt-1 text-sm font-bold text-teal">
                    {discount}% abaixo do preço típico da rota
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted">
                    comparado com 90 dias de histórico
                  </p>
                )}
              </div>
              <div className="rounded-2xl bg-cream px-4 py-3 text-right text-xs">
                <p className="font-bold uppercase tracking-wide text-muted">
                  preço observado
                </p>
                <p className="mt-1 font-semibold">
                  {formatDateTime(offer.priceObservedAt)}
                </p>
                <p className="mt-0.5 text-muted">
                  {relativeTime(offer.priceObservedAt)}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 border-t border-dashed border-line pt-5 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 text-sm">
                <PlaneIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                <div>
                  <p className="font-semibold">
                    {offer.carrier ?? "Companhia a definir"}
                  </p>
                  <p className="text-xs text-muted">
                    {stopsLabel(offer.stops)} ·{" "}
                    {formatDuration(offer.durationMinutes)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <BaggageIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                <div>
                  <p className="font-semibold">
                    {offer.bagsIncluded === true
                      ? "Bagagem inclusa"
                      : offer.bagsIncluded === false
                        ? "Sem bagagem inclusa"
                        : "Bagagem não informada"}
                  </p>
                  <p className="text-xs text-muted">
                    {offer.selfTransfer
                      ? "Conexão por conta própria"
                      : "Conexão única no bilhete"}
                  </p>
                </div>
              </div>
            </div>

            {offer.coldStart ? (
              <p className="mt-5 rounded-xl bg-teal-soft/60 px-4 py-3 text-xs leading-5 text-ink-soft">
                Esta é uma oferta de prévia: a rota ainda não tem 60–90 dias de
                histórico. O preço foi comparado ao teto manual da rota e será
                revisado por uma pessoa antes de ganhar destaque.
              </p>
            ) : null}
          </div>

          <div className="card mt-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Histórico da rota</p>
                <h2 className="mt-1 font-display text-2xl font-bold">
                  Preço nos últimos 60 dias
                </h2>
              </div>
              <Link
                href={`/passagens/${offer.origin.iata}/${offer.destination.iata}`}
                className="text-sm font-bold text-teal"
              >
                Ver rota completa
              </Link>
            </div>
            <div className="mt-5">
              <PriceChart points={history} id="offer-chart" />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-paper p-5 text-xs leading-6 text-muted">
            {affiliateDisclosure} O preço exibido foi observado em{" "}
            {formatDateTime(offer.priceObservedAt)} e pode mudar até o momento da
            compra. Confirme sempre o valor final no site da companhia ou
            agência.
          </div>

          {related.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-bold">
                Outras ofertas desta rota
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {related.map((item) => (
                  <TicketCard key={item.id} offer={item} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-12">
            <div className="max-w-2xl">
              <p className="eyebrow">Alerta desta rota</p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                Avisamos quando aparecer de novo
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Crie um alerta para {offer.origin.city} →{" "}
                {offer.destination.city}. Você só recebe quando o preço estiver
                dentro do seu limite.
              </p>
            </div>
            <div className="mt-5 max-w-2xl">
              <AlertForm
                airports={airports}
                defaultOrigin={offer.origin.iata}
                defaultDestination={offer.destination.iata}
                fixedRoute
              />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <DestinationImage
            iata={offer.destination.iata}
            city={offer.destination.city}
            priority
          />
          <div className="card mt-4 p-6">
            <p className="eyebrow">Verificar disponibilidade</p>
            <p className="mt-2 font-display text-4xl font-extrabold">
              {formatBRL(offer.priceCents)}
            </p>
            <p className="text-sm text-muted">
              ida e volta · {offer.tripDays ?? "?"} dias
            </p>

            <a
              href={`/go/${offer.id}?c=site`}
              className="btn btn-primary mt-5 w-full"
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
            >
              Ver preço atual
              <ArrowUpRightIcon className="h-4 w-4" />
            </a>
            <p className="mt-3 text-center text-[11px] leading-5 text-muted">
              Você será redirecionado para a companhia ou agência. O preço pode
              mudar em segundos.
            </p>

            <div className="mt-5 space-y-2.5 border-t border-line pt-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Expira</span>
                <span className="font-semibold">
                  {offer.expiresAt
                    ? formatDateTime(offer.expiresAt)
                    : "em breve"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Nível</span>
                <span className="font-semibold">
                  {offer.level === "error"
                    ? "Excepcional"
                    : offer.level === "great"
                      ? "Ótima"
                      : "Boa"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Cliques</span>
                <span className="font-semibold">{offer.clickCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-paper p-5">
            <div className="flex items-start gap-2.5">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <p className="text-xs leading-5 text-muted">
                O Voa Leve não vende passagens. Indicamos a oferta e você compra
                direto na companhia ou agência.
              </p>
            </div>
            <div className="mt-3 flex items-start gap-2.5">
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <p className="text-xs leading-5 text-muted">
                Ofertas boas duram até 24h; ótimas, 12h; excepcionais, 6h. Depois
                disso, saem do ar.
              </p>
            </div>
            <div className="mt-3 flex items-start gap-2.5">
              <TrendingDownIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <p className="text-xs leading-5 text-muted">
                Comparação com mediana e percentis de 90 dias, não com “preço de
                ontem”.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
