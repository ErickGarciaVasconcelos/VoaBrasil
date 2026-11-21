import type { Metadata } from "next";
import Link from "next/link";
import { publishAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { LevelPill, StatusBadge } from "@/components/admin/badges";
import { requireAdmin } from "@/lib/auth";
import { formatBRL, formatDateRange, formatDateTime } from "@/lib/format";
import { getAdminOffers } from "@/lib/queries";
import type { AdminOfferView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofertas",
  robots: { index: false, follow: false },
};

const statusFilters = [
  { value: "", label: "Todas" },
  { value: "draft", label: "Rascunhos" },
  { value: "published", label: "Publicadas" },
  { value: "rejected", label: "Rejeitadas" },
  { value: "expired", label: "Expiradas" },
];

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = ["draft", "approved", "published", "rejected", "expired"].includes(
    rawStatus,
  )
    ? rawStatus
    : undefined;

  let offers: AdminOfferView[] = [];
  let dbError: string | null = null;
  try {
    offers = await getAdminOffers({ status, limit: 150 });
  } catch (error) {
    console.error("[admin/ofertas] erro:", error);
    dbError = error instanceof Error ? error.message : "Erro desconhecido";
  }

  const ok = typeof params.ok === "string" ? params.ok : null;

  return (
    <AdminShell
      title="Ofertas"
      description="Revise, publique ou rejeite as tarifas detectadas pelo motor. Ofertas publicadas entram no site e na fila de notificações."
      actions={
        <Link href="/admin" className="btn btn-outline px-4 py-2 text-xs">
          Voltar ao painel
        </Link>
      }
    >
      {ok === "publicada" ? (
        <p className="mb-5 rounded-2xl border border-good/20 bg-good-soft px-4 py-3 text-sm text-good">
          Oferta publicada. As notificações foram enfileiradas.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((filter) => {
          const active = (status ?? "") === filter.value;
          const href = filter.value
            ? `/admin/ofertas?status=${filter.value}`
            : "/admin/ofertas";
          return (
            <Link
              key={filter.label}
              href={href}
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
        <span className="ml-auto text-xs text-muted">
          {offers.length} {offers.length === 1 ? "oferta" : "ofertas"}
        </span>
      </div>

      {dbError ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar ofertas: {dbError}
        </p>
      ) : offers.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-paper p-10 text-center">
          <h2 className="font-display text-xl font-bold">
            Nenhuma oferta neste filtro
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Rode o pipeline no painel ou gere a demonstração para criar ofertas.
          </p>
          <Link href="/admin" className="btn btn-primary mt-5">
            Ir para o painel
          </Link>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-3xl border border-line bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-line bg-cream/60 text-[10px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Rota</th>
                  <th className="px-4 py-3 font-bold">Datas</th>
                  <th className="px-4 py-3 font-bold">Preço</th>
                  <th className="px-4 py-3 font-bold">Nível</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Criada</th>
                  <th className="px-4 py-3 font-bold">Cliques</th>
                  <th className="px-4 py-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {offers.map((offer) => (
                  <tr key={offer.id} className="align-top">
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/ofertas/${offer.id}`}
                        className="font-display text-sm font-bold hover:text-teal"
                      >
                        {offer.originIata} → {offer.destinationIata}
                      </Link>
                      <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-muted">
                        {offer.title}
                      </p>
                      {offer.coldStart ? (
                        <span className="mt-1 inline-flex rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-semibold text-teal">
                          prévia
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {formatDateRange(offer.departureDate, offer.returnDate)}
                    </td>
                    <td className="px-4 py-4 font-bold">
                      {formatBRL(offer.priceCents)}
                    </td>
                    <td className="px-4 py-4">
                      <LevelPill level={offer.level} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={offer.status} />
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {formatDateTime(offer.createdAt)}
                    </td>
                    <td className="px-4 py-4">{offer.clickCount}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/admin/ofertas/${offer.id}`}
                          className="rounded-full border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-ink/30"
                        >
                          Detalhes
                        </Link>
                        {offer.status === "draft" ? (
                          <form action={publishAction}>
                            <input type="hidden" name="offerId" value={offer.id} />
                            <button
                              type="submit"
                              className="rounded-full bg-coral px-3 py-1.5 font-bold text-paper hover:bg-[#e94b29]"
                            >
                              Publicar
                            </button>
                          </form>
                        ) : null}
                        {offer.status === "published" ? (
                          <Link
                            href={`/ofertas/${offer.slug}`}
                            target="_blank"
                            className="rounded-full bg-teal-soft px-3 py-1.5 font-bold text-teal"
                          >
                            Ver no site
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
