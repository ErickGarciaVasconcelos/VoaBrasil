import Link from "next/link";
import { site } from "@/lib/site";
import {
  ArrowUpRightIcon,
  BellIcon,
  PlaneIcon,
  TelegramIcon,
} from "./icons";

const links = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/passagens", label: "Rotas" },
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/alertas", label: "Alertas" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-paper">
            <PlaneIcon className="h-5 w-5 -rotate-12" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            voa leve<span className="text-coral">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/alertas"
            className="hidden items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30 hover:bg-ink/5 sm:inline-flex"
          >
            <BellIcon className="h-3.5 w-3.5" />
            Criar alerta
          </Link>
          <a
            href={site.telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ink px-4 py-2 text-xs"
          >
            <TelegramIcon className="h-4 w-4" />
            Telegram
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <nav className="container-page flex gap-5 overflow-x-auto pb-3 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap text-xs font-semibold text-ink-soft"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
