import Link from "next/link";
import { SparkIcon } from "./icons";

export function EmptyState({
  title = "Nenhuma oferta publicada ainda",
  description = "O motor está coletando preços. Enquanto isso, você pode criar um alerta ou rodar a demonstração no painel administrativo.",
  actionHref = "/alertas",
  actionLabel = "Criar alerta",
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-paper/70 p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-soft text-teal">
        <SparkIcon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link href={actionHref} className="btn btn-ink">
          {actionLabel}
        </Link>
        {process.env.NODE_ENV !== "production" ? (
          <Link href="/admin" className="btn btn-outline">
            Abrir painel
          </Link>
        ) : null}
      </div>
    </div>
  );
}
