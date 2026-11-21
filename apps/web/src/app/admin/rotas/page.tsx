import type { Metadata } from "next";
import Link from "next/link";
import {
  toggleRouteAction,
  updateRouteAction,
} from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { formatBRL, formatDateTime, relativeTime } from "@/lib/format";
import { getAdminRoutes } from "@/lib/queries";
import type { RouteView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rotas",
  robots: { index: false, follow: false },
};

function messageFor(
  ok: string | null,
  erro: string | null,
): { tone: "ok" | "erro"; text: string } | null {
  if (ok === "ativada") return { tone: "ok", text: "Coleta da rota ativada." };
  if (ok === "pausada") return { tone: "ok", text: "Coleta da rota pausada." };
  if (ok === "rota-atualizada") {
    return { tone: "ok", text: "Configuração da rota atualizada." };
  }
  if (erro === "ceiling") {
    return { tone: "erro", text: "O teto precisa ser um valor positivo em reais." };
  }
  if (erro) return { tone: "erro", text: "Não foi possível atualizar a rota." };
  return null;
}

function RouteAdminCard({ route }: { route: RouteView }) {
  return (
    <div className="rounded-3xl border border-line bg-paper p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            {route.origin.iata} → {route.destination.iata}
          </p>
          <h2 className="mt-1 font-display text-xl font-bold">
            {route.origin.city} → {route.destination.city}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {route.destination.name}
          </p>
        </div>
        <span
          className={
            route.monitorEnabled
              ? "rounded-full bg-good-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-good"
              : "rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted"
          }
        >
          {route.monitorEnabled ? "monitorando" : "pausada"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-cream px-2 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted">
            melhor preço
          </p>
          <p className="mt-0.5 text-xs font-bold">
            {route.bestPriceCents ? formatBRL(route.bestPriceCents) : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-cream px-2 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted">
            ofertas
          </p>
          <p className="mt-0.5 text-xs font-bold">{route.offerCount}</p>
        </div>
        <div className="rounded-xl bg-cream px-2 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted">
            teto manual
          </p>
          <p className="mt-0.5 text-xs font-bold">
            {route.ceilingCents ? formatBRL(route.ceilingCents) : "—"}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        Última coleta:{" "}
        {route.lastCollectedAt
          ? `${formatDateTime(route.lastCollectedAt)} (${relativeTime(route.lastCollectedAt)})`
          : "nunca"}
      </p>

      <form action={updateRouteAction} className="mt-4 space-y-3 border-t border-line pt-4">
        <input type="hidden" name="routeId" value={route.id} />
        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="label text-[9px]">Teto (R$)</span>
            <input
              type="number"
              name="ceiling"
              min={1}
              step={50}
              defaultValue={
                route.ceilingCents ? Math.round(route.ceilingCents / 100) : ""
              }
              placeholder="—"
              className="field px-2 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="label text-[9px]">Prioridade</span>
            <input
              type="number"
              name="priority"
              min={1}
              max={10}
              defaultValue={route.priority}
              className="field px-2 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="label text-[9px]">Máx. escalas</span>
            <input
              type="number"
              name="maxStops"
              min={0}
              max={4}
              defaultValue={route.maxStops}
              className="field px-2 py-2 text-xs"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn btn-outline px-3 py-2 text-[11px]">
            Salvar rota
          </button>
          <Link
            href={`/passagens/${route.origin.iata}/${route.destination.iata}`}
            target="_blank"
            className="text-[11px] font-bold text-teal underline underline-offset-2"
          >
            Ver página pública
          </Link>
        </div>
      </form>

      <form action={toggleRouteAction} className="mt-2">
        <input type="hidden" name="routeId" value={route.id} />
        <input
          type="hidden"
          name="enabled"
          value={route.monitorEnabled ? "false" : "true"}
        />
        <button
          type="submit"
          className="text-[11px] font-semibold text-muted underline underline-offset-2 hover:text-ink"
        >
          {route.monitorEnabled ? "Pausar coleta desta rota" : "Ativar coleta desta rota"}
        </button>
      </form>
    </div>
  );
}

export default async function AdminRoutesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const ok = typeof params.ok === "string" ? params.ok : null;
  const erro = typeof params.erro === "string" ? params.erro : null;
  const message = messageFor(ok, erro);

  let routes: RouteView[] = [];
  let dbError: string | null = null;
  try {
    routes = await getAdminRoutes();
  } catch (error) {
    console.error("[admin/rotas] erro:", error);
    dbError = error instanceof Error ? error.message : "Erro desconhecido";
  }

  const active = routes.filter((route) => route.monitorEnabled).length;

  return (
    <AdminShell
      title="Rotas"
      description="Controle quais rotas entram na coleta, o teto manual de cold start e a prioridade do worker."
      actions={
        <Link href="/admin" className="btn btn-outline px-4 py-2 text-xs">
          Voltar ao painel
        </Link>
      }
    >
      {message ? (
        <p
          className={
            message.tone === "ok"
              ? "mb-5 rounded-2xl border border-good/20 bg-good-soft px-4 py-3 text-sm text-good"
              : "mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="rounded-full bg-paper px-3 py-1.5 font-semibold ring-1 ring-line">
          {routes.length} rotas cadastradas
        </span>
        <span className="rounded-full bg-good-soft px-3 py-1.5 font-semibold text-good">
          {active} monitorando
        </span>
        <span className="rounded-full bg-paper px-3 py-1.5 font-semibold ring-1 ring-line">
          {routes.length - active} pausadas
        </span>
      </div>

      {dbError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar rotas: {dbError}
        </p>
      ) : routes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-paper p-10 text-center">
          <h2 className="font-display text-xl font-bold">
            Nenhuma rota cadastrada
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Rode a demonstração no painel para criar as rotas iniciais.
          </p>
          <Link href="/admin" className="btn btn-primary mt-5">
            Ir para o painel
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {routes.map((route) => (
            <RouteAdminCard key={route.id} route={route} />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
