import type { Metadata } from "next";
import Link from "next/link";
import {
  dispatchAction,
  expireAllAction,
  runDemoAction,
  runPipelineAction,
} from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { LevelPill, StatusBadge } from "@/components/admin/badges";
import { ArrowRightIcon, ClockIcon, SparkIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { formatBRL, formatDateTime, formatDateRange, relativeTime } from "@/lib/format";
import {
  getAdminOffers,
  getAdminStats,
  getCollectorRuns,
} from "@/lib/queries";
import type { AdminOfferView, AdminStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Visão geral",
  robots: { index: false, follow: false },
};

function param(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  return typeof value === "string" ? value : null;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-[11px] text-muted">{hint}</p>
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;

  let stats: AdminStats | null = null;
  let recent: AdminOfferView[] = [];
  let runs: Awaited<ReturnType<typeof getCollectorRuns>> = [];
  let dbError: string | null = null;

  try {
    [stats, recent, runs] = await Promise.all([
      getAdminStats(),
      getAdminOffers({ limit: 8 }),
      getCollectorRuns(5),
    ]);
  } catch (error) {
    console.error("[admin] erro ao carregar dashboard:", error);
    dbError = error instanceof Error ? error.message : "Erro desconhecido";
  }

  const ok = param(params, "ok");
  const erro = param(params, "erro");
  const success =
    ok === "demo"
      ? `Demonstração recriada: ${param(params, "ofertas") ?? "0"} ofertas publicadas e ${param(params, "snapshots") ?? "0"} snapshots.`
      : ok === "pipeline"
        ? `Pipeline executado: ${param(params, "snapshots") ?? "0"} snapshots, ${param(params, "buckets") ?? "0"} buckets, ${param(params, "publicadas") ?? "0"} ofertas publicadas e ${param(params, "enviadas") ?? "0"} envios.`
        : ok === "notify"
          ? `${param(params, "processadas") ?? "0"} notificações processadas.`
          : ok === "expire"
            ? `${param(params, "expiradas") ?? "0"} ofertas expiradas.`
            : null;

  const errorMessage =
    erro === "demo"
      ? "Não foi possível recriar a demonstração. Veja o log do servidor."
      : erro === "pipeline"
        ? "O pipeline falhou. Veja o log do servidor."
        : erro === "notify"
          ? "Não foi possível processar as notificações."
          : erro === "expire"
            ? "Não foi possível expirar as ofertas."
            : null;

  return (
    <AdminShell
      title="Visão geral"
      description="O pulso do motor: ofertas, cliques, assinantes e a última coleta."
      actions={
        <>
          <Link href="/admin/ofertas" className="btn btn-outline px-4 py-2 text-xs">
            Revisar ofertas
          </Link>
          <Link href="/admin/rotas" className="btn btn-ink px-4 py-2 text-xs">
            Gerenciar rotas
          </Link>
        </>
      }
    >
      {success ? (
        <p className="mb-5 rounded-2xl border border-good/20 bg-good-soft px-4 py-3 text-sm text-good">
          {success}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {dbError ? (
        <div className="rounded-3xl border border-dashed border-line bg-paper p-8">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-sun/20 text-[#7a5100]">
            <SparkIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold">
            Banco ainda não inicializado
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            O painel abriu, mas as tabelas não estão prontas. Rode a migração e o
            seed de demonstração no terminal:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs text-paper">
            npm run db:generate{"\n"}npm run demo
          </pre>
          <p className="mt-3 text-xs text-muted">Erro: {dbError}</p>
          <form action={runDemoAction} className="mt-5">
            <button type="submit" className="btn btn-primary">
              Tentar criar demonstração agora
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Publicadas"
              value={stats?.published ?? 0}
              hint="ofertas no ar agora"
            />
            <StatCard
              label="Rascunhos"
              value={stats?.drafts ?? 0}
              hint="aguardando revisão"
            />
            <StatCard
              label="Cliques 24h"
              value={stats?.clicks24h ?? 0}
              hint="saídas para afiliado"
            />
            <StatCard
              label="Assinantes"
              value={stats?.subscribers ?? 0}
              hint="e-mails confirmados"
            />
            <StatCard
              label="Fila"
              value={stats?.pendingNotifications ?? 0}
              hint="notificações pendentes"
            />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-line bg-paper p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Últimas ofertas</p>
                  <h2 className="mt-1 font-display text-xl font-bold">
                    Fila de revisão e publicadas
                  </h2>
                </div>
                <Link
                  href="/admin/ofertas"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal"
                >
                  Ver todas
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recent.length === 0 ? (
                <p className="mt-6 rounded-xl bg-cream px-4 py-6 text-center text-sm text-muted">
                  Nenhuma oferta criada ainda. Rode o pipeline para popular.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
                      <tr>
                        <th className="py-2 pr-3 font-bold">Oferta</th>
                        <th className="px-3 py-2 font-bold">Preço</th>
                        <th className="px-3 py-2 font-bold">Nível</th>
                        <th className="px-3 py-2 font-bold">Status</th>
                        <th className="py-2 pl-3 text-right font-bold">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/70">
                      {recent.map((offer) => (
                        <tr key={offer.id}>
                          <td className="py-3 pr-3">
                            <p className="font-semibold">
                              {offer.originIata} → {offer.destinationIata}
                            </p>
                            <p className="text-[11px] text-muted">
                              {formatDateRange(offer.departureDate, offer.returnDate)}
                            </p>
                          </td>
                          <td className="px-3 py-3 font-bold">
                            {formatBRL(offer.priceCents)}
                          </td>
                          <td className="px-3 py-3">
                            <LevelPill level={offer.level} />
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={offer.status} />
                          </td>
                          <td className="py-3 pl-3 text-right">
                            <Link
                              href={`/admin/ofertas/${offer.id}`}
                              className="font-bold text-teal"
                            >
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="space-y-5">
              <section className="rounded-3xl border border-line bg-paper p-6">
                <p className="eyebrow">Motor</p>
                <h2 className="mt-1 font-display text-xl font-bold">
                  Ações rápidas
                </h2>
                <div className="mt-4 space-y-2.5">
                  <form action={runPipelineAction}>
                    <button type="submit" className="btn btn-primary w-full text-xs">
                      Rodar pipeline agora
                    </button>
                  </form>
                  <form action={dispatchAction}>
                    <button type="submit" className="btn btn-outline w-full text-xs">
                      Processar notificações
                    </button>
                  </form>
                  <form action={expireAllAction}>
                    <button type="submit" className="btn btn-outline w-full text-xs">
                      Expirar ofertas vencidas
                    </button>
                  </form>
                  <form action={runDemoAction}>
                    <button type="submit" className="btn btn-ghost w-full text-xs text-muted">
                      Recriar demonstração (apaga ofertas)
                    </button>
                  </form>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-muted">
                  O pipeline usa a fonte configurada em{" "}
                  <code className="font-semibold text-ink">PRICE_SOURCE</code>{" "}
                  (padrão: mock).
                </p>
              </section>

              <section className="rounded-3xl border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-teal" />
                  <p className="eyebrow">Última coleta</p>
                </div>
                {stats?.lastRun ? (
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">Fonte</span>
                      <span className="font-semibold">{stats.lastRun.source}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">Status</span>
                      <span className="font-semibold">{stats.lastRun.status}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">Início</span>
                      <span className="font-semibold">
                        {formatDateTime(stats.lastRun.startedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">Erros</span>
                      <span className="font-semibold">{stats.lastRun.errors}</span>
                    </div>
                    {stats.lastRun.message ? (
                      <p className="rounded-lg bg-cream px-3 py-2 text-[11px] leading-5 text-muted">
                        {stats.lastRun.message}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted">
                    Nenhuma coleta registrada ainda.
                  </p>
                )}
              </section>
            </div>
          </div>

          <section className="mt-6 rounded-3xl border border-line bg-paper p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Histórico do motor</p>
                <h2 className="mt-1 font-display text-xl font-bold">
                  Coletas recentes
                </h2>
              </div>
            </div>
            {runs.length === 0 ? (
              <p className="mt-4 text-xs text-muted">Sem execuções.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pr-3 font-bold">Fonte</th>
                      <th className="px-3 py-2 font-bold">Status</th>
                      <th className="px-3 py-2 font-bold">Início</th>
                      <th className="px-3 py-2 font-bold">Requisições</th>
                      <th className="px-3 py-2 font-bold">Erros</th>
                      <th className="py-2 pl-3 font-bold">Mensagem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {runs.map((run) => (
                      <tr key={run.id}>
                        <td className="py-3 pr-3 font-semibold">{run.source}</td>
                        <td className="px-3 py-3">{run.status}</td>
                        <td className="px-3 py-3 text-muted">
                          {formatDateTime(run.startedAt)}{" "}
                          <span className="text-[10px]">
                            ({relativeTime(run.startedAt)})
                          </span>
                        </td>
                        <td className="px-3 py-3">{run.requests}</td>
                        <td className="px-3 py-3">{run.errors}</td>
                        <td className="max-w-[260px] truncate py-3 pl-3 text-muted">
                          {run.message ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
