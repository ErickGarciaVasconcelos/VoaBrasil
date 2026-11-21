import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, MailIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alerta confirmado",
  robots: { index: false, follow: false },
};

const states = {
  ok: {
    title: "Alerta confirmado",
    description:
      "Pronto. Você está na lista e vai receber um e-mail quando aparecer uma passagem dentro do seu limite. Ofertas boas vão no resumo das 18h; ótimas e excepcionais saem na hora.",
    tone: "success" as const,
  },
  invalido: {
    title: "Link inválido ou expirado",
    description:
      "O link de confirmação não é válido ou já passou do prazo de 48 horas. Crie o alerta novamente para receber um novo link.",
    tone: "error" as const,
  },
  erro: {
    title: "Não conseguimos confirmar agora",
    description:
      "Tivemos um problema ao ativar seu alerta. Tente abrir o link novamente em alguns minutos ou crie o alerta de novo.",
    tone: "error" as const,
  },
  padrao: {
    title: "Confirme seu alerta pelo e-mail",
    description:
      "Abra o link que enviamos para o seu e-mail. Ele é necessário para ativar o alerta e evitar inscrições de terceiros.",
    tone: "neutral" as const,
  },
};

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "padrao";
  const state = states[status as keyof typeof states] ?? states.padrao;
  const success = state.tone === "success";

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-paper p-8 text-center sm:p-10">
        <span
          className={
            success
              ? "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-good-soft text-good"
              : "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cream text-muted"
          }
        >
          {success ? (
            <CheckIcon className="h-7 w-7" />
          ) : (
            <MailIcon className="h-7 w-7" />
          )}
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold">
          {state.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">{state.description}</p>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/ofertas" className="btn btn-primary">
            Ver ofertas agora
          </Link>
          <Link href="/alertas" className="btn btn-outline">
            Criar outro alerta
          </Link>
        </div>

        {success ? (
          <p className="mt-6 text-xs text-muted">
            Dica: adicione <strong>alertas@voaleve.com.br</strong> aos seus
            contatos para o e-mail não cair em promoções.
          </p>
        ) : null}
      </div>
    </div>
  );
}
