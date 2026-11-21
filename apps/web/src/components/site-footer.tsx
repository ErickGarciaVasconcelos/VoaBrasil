import Link from "next/link";
import { affiliateDisclosure, site } from "@/lib/site";
import { Brand } from "./brand";

const explore = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/passagens", label: "Rotas monitoradas" },
  { href: "/alertas", label: "Criar alerta" },
  { href: "/como-funciona", label: "Como funciona" },
];

const legal = [
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Privacidade e LGPD" },
  { href: "/divulgacao-afiliado", label: "Divulgação de afiliado" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              Passagens baratas encontradas por dados, não por achismo. Comparamos
              cada preço com o histórico da rota e mostramos só o que vale a pena.
            </p>
            <p className="mt-4 text-xs text-muted">
              Contato:{" "}
              <a
                className="font-semibold text-teal"
                href={`mailto:${site.contactEmail}`}
              >
                {site.contactEmail}
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">
              Explorar
            </h3>
            <ul className="mt-4 space-y-2.5">
              {explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition hover:text-teal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">
              Institucional
            </h3>
            <ul className="mt-4 space-y-2.5">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition hover:text-teal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="text-xs leading-5 text-muted">{affiliateDisclosure}</p>
          <p className="mt-3 text-xs text-muted">
            © {new Date().getFullYear()} {site.name}. Preços e disponibilidade
            mudam sem aviso. Confirme sempre no site da companhia ou agência.
          </p>
        </div>
      </div>
    </footer>
  );
}
