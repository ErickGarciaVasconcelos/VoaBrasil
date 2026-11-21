import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  expireAction,
  publishAction,
  rejectAction,
  reopenAction,
} from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { LevelPill, StatusBadge } from "@/components/admin/badges";
import { ArrowUpRightIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import {
  formatBRL,
  formatDateRange,
  formatDateTime,
  relativeTime,
  stopsLabel,
} from "@/lib/format";
import {
  getAdminOffer,
  getOfferEvents,
  getOfferNotifications,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalhe da oferta",
  robots: { index: false, follow: false },
};

const eventLabels: Record<string, string> = {
  published: "Publicada",
  rejected: "Rejeitada",
  expired: "Expirada automaticamente",
  expired_manually: "Expirada manualmente",
  reopened: "Reaberta como rascunho",
  price_rose: "Preço subiu na revalidação",
};

function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/70 py-2.5 text-xs last:border-0">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

export default async function AdminOfferDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;

  const offer = await getAdminOffer(id);
  if (!offer) notFound();

  const [events, notifications] = await Promise.all([
    getOfferEvents(id),
    getOfferNotifications(id),
  ]);

  const ok = typeof query.ok === "string" ? query.ok : null;
  const erro = typeof query.erro === "string" ? query.erro : null;
  const success =
    ok === "publicada"
      ? "Oferta publicada e notificações enfileiradas."
      : ok === "rejeitada"
        ? "Oferta rejeitada."
        : ok === "expirada"
          ? "Oferta expirada."
          : ok === "reaberta"
            ? "Oferta reaberta como rascunho."
            : null;

  return (
    <AdminShell
      title={`${offer.originIata} → ${offer.destinationIata}`}
      description={offer.title}
      actions={
        <>
          <Link
            href="/admin/ofertas"
            className="btn btn-outline px-4 py-2 text-xs"
          >
            Voltar
          </Link>
          {offer.status === "published" ? (
            <Link
              href={`/ofertas/${offer.slug}`}
              target="_blank"
              className="btn btn-ink px-4 py-2 text-xs"
            >
              Ver no site
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </>
      }
    >
      {success ? (
        <p className="mb-5 rounded-2xl border border-good/20 bg-good-soft px-4 py-3 text-sm text-good">
          {success}
        </p>
      ) : null}
      {erro ? (
        <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Não foi possível concluir a ação. Veja o log do servidor.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-paper p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={offer.status} />
              <LevelPill level={offer.level} />
              {offer.coldStart ? (
                <span className="rounded-full bg-teal-soft px-2.5 py-1 text-[10px] font-bold text-teal">
                  cold start
                </span>
              ) : null}
            </div>
            <p className="mt-4 font-display text-4xl font-extrabold">
              {formatBRL(offer.priceCents)}
            </p>
            <p className="mt-1 text-sm text-muted">
              ida e volta · {formatDateRange(offer.departureDate, offer.returnDate)}
            </p>

            <div className="mt-5 grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-xl bg-cream px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  Preço observado
                </p>
                <p className="mt-0.5 font-semibold">
                  {formatDateTime(offer.priceObservedAt)}{" "}
                  <span className="font-normal text-muted">
                    ({relativeTime(offer.priceObservedAt)})
                  </span>
                </p>
              </div>
              <div className="rounded-xl bg-cream px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  Expira
                </p>
                <p className="mt-0.5 font-semibold">
                  {offer.expiresAt
                    ? `${formatDateTime(offer.expiresAt)} (${relativeTime(offer.expiresAt)})`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {offer.status === "draft" || offer.status === "approved" ? (
                <form action={publishAction}>
                  <input type="hidden" name="offerId" value={offer.id} />
                  <button type="submit" className="btn btn-primary text-xs">
                    Publicar agora
                  </button>
                </form>
              ) : null}
              {offer.status === "published" ? (
                <form action={expireAction}>
                  <input type="hidden" name="offerId" value={offer.id} />
                  <button type="submit" className="btn btn-outline text-xs">
                    Expirar agora
                  </button>
                </form>
              ) : null}
              {offer.status !== "published" && offer.status !== "rejected" ? (
                <form action={rejectAction}>
                  <input type="hidden" name="offerId" value={offer.id} />
                  <button type="submit" className="btn btn-ghost text-xs text-muted">
                    Rejeitar
                  </button>
                </form>
              ) : null}
              {offer.status === "rejected" || offer.status === "expired" ? (
                <form action={reopenAction}>
                  <input type="hidden" name="offerId" value={offer.id} />
                  <button type="submit" className="btn btn-outline text-xs">
                    Reabrir como rascunho
                  </button>
                </form>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-paper p-6">
            <p className="eyebrow">Metadados</p>
            <h2 className="mt-1 font-display text-xl font-bold">
              Dados da oferta
            </h2>
            <div className="mt-3">
              <DataRow label="Fonte" value={offer.source} />
              <DataRow label="Companhia" value={offer.carrier ?? "—"} />
              <DataRow label="Paradas" value={stopsLabel(offer.stops)} />
              <DataRow
                label="Duração"
                value={
                  offer.durationMinutes
                    ? `${Math.floor(offer.durationMinutes / 60)}h ${offer.durationMinutes % 60}min`
                    : "—"
                }
              />
              <DataRow
                label="Bagagem"
                value={
                  offer.bagsIncluded == null
                    ? "não informada"
                    : offer.bagsIncluded
                      ? "inclusa"
                      : "não inclusa"
                }
              />
              <DataRow
                label="Self transfer"
                value={offer.selfTransfer ? "sim" : "não"}
              />
              <DataRow
                label="Dedup hash"
                value={<code className="text-[11px]">{offer.dedupHash}</code>}
              />
              <DataRow
                label="Criada em"
                value={formatDateTime(offer.createdAt)}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-paper p-6">
            <p className="eyebrow">Classificação</p>
            <h2 className="mt-1 font-display text-xl font-bold">
              Por que foi detectada
            </h2>
            <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-ink p-4 text-[11px] leading-5 text-paper">
              {JSON.stringify(offer.reason ?? {}, null, 2)}
            </pre>
            {offer.deepLink ? (
              <div className="mt-4 rounded-xl border border-line bg-cream p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  Deep link de afiliado
                </p>
                <a
                  href={offer.deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-xs font-semibold text-teal underline underline-offset-2"
                >
                  {offer.deepLink}
                </a>
              </div>
            ) : null}
            <Link
              href={`/go/${offer.id}?c=admin`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-xs font-bold text-coral underline underline-offset-4"
            >
              Testar redirecionamento rastreado →
            </Link>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-paper p-6">
            <p className="eyebrow">Eventos</p>
            <h2 className="mt-1 font-display text-xl font-bold">Linha do tempo</h2>
            {events.length === 0 ? (
              <p className="mt-3 text-xs text-muted">Nenhum evento registrado.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {events.map((event) => (
                  <li key={event.id} className="flex gap-3 text-xs">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal" />
                    <div>
                      <p className="font-semibold">
                        {eventLabels[event.type] ?? event.type}
                      </p>
                      <p className="text-[11px] text-muted">
                        {formatDateTime(event.createdAt)} · {event.actor ?? "sistema"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-3xl border border-line bg-paper p-6">
            <p className="eyebrow">Notificações</p>
            <h2 className="mt-1 font-display text-xl font-bold">
              Fila de envio
            </h2>
            {notifications.length === 0 ? (
              <p className="mt-3 text-xs text-muted">
                Nenhuma notificação para esta oferta.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-xl border border-line bg-cream/60 px-3 py-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{notification.channel}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                        {notification.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-muted">
                      {notification.recipient}
                    </p>
                    {notification.error ? (
                      <p className="mt-1 text-[10px] leading-4 text-red-600">
                        {notification.error}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
