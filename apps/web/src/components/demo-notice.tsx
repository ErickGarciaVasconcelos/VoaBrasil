import Link from "next/link";

/**
 * Aviso exibido apenas quando a coleta usa a fonte determinística de demonstração.
 * Evita que preços sintéticos sejam confundidos com tarifas reais de parceiros.
 */
export function DemoNotice({ className = "" }: { className?: string }) {
  if (process.env.PRICE_SOURCE?.trim().toLowerCase() !== "mock") return null;

  return (
    <div
      className={`rounded-2xl border border-sun/40 bg-sun/15 px-5 py-4 text-sm leading-6 text-ink-soft ${className}`}
    >
      <strong className="font-bold text-ink">Ambiente de demonstração.</strong>{" "}
      Preços, histórico e alertas desta versão são sintéticos e servem para
      validar a experiência. Em produção, a coleta vem das APIs dos parceiros.
      Entenda em{" "}
      <Link
        href="/como-funciona"
        className="font-semibold text-teal underline decoration-teal/40 underline-offset-2"
      >
        como funciona
      </Link>
      .
    </div>
  );
}
