import Link from "next/link";
import { usingPglite } from "@ppa/db";
import { ArrowUpRightIcon, PlaneIcon } from "@/components/icons";
import { logoutAction } from "@/app/admin/actions";

const nav = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/ofertas", label: "Ofertas" },
  { href: "/admin/rotas", label: "Rotas" },
  { href: "/ofertas", label: "Ver site" },
];

export function AdminShell({
  children,
  title,
  description,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-white/10 bg-ink text-paper">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-paper/10">
                <PlaneIcon className="h-4 w-4 -rotate-12" />
              </span>
              <span className="font-display text-lg font-bold">
                voa leve <span className="text-sun">admin</span>
              </span>
            </Link>
            <span className="hidden rounded-full border border-paper/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-paper/60 sm:inline">
              {usingPglite() ? "PGlite local" : "Postgres"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-paper/75 transition hover:bg-paper/10 hover:text-paper"
              >
                {item.label}
              </Link>
            ))}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-paper/60 transition hover:bg-paper/10 hover:text-paper"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Painel administrativo</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>

        {usingPglite() ? (
          <p className="mt-5 rounded-2xl border border-sun/40 bg-sun/10 px-4 py-3 text-xs leading-5 text-[#7a5100]">
            Você está no PGlite local. Ele é single-process: pare o worker antes
            de usar o painel e vice-versa. Em produção, configure{" "}
            <code className="font-semibold">DATABASE_URL</code>.
          </p>
        ) : null}

        <div className="mt-7">{children}</div>
      </main>

      <footer className="container-page flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-xs text-muted">
        <span>
          {usingPglite() ? "Ambiente de desenvolvimento" : "Ambiente conectado"} ·
          dados internos
        </span>
        <Link href="/" className="inline-flex items-center gap-1 font-semibold text-teal">
          Abrir site público
          <ArrowUpRightIcon className="h-3.5 w-3.5" />
        </Link>
      </footer>
    </div>
  );
}
