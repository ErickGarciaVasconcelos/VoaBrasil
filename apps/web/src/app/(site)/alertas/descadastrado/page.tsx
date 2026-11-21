import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, MailIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscrição cancelada",
  robots: { index: false, follow: false },
};

const states = {
  ok: {
    title: "Inscrição cancelada",
    description:
      "Pronto, você não recebe mais alertas do Voa Leve. Todos os seus alertas foram desativados. Se mudar de ideia, é só criar um novo.",
    success: true,
  },
  invalido: {
    title: "Link inválido ou expirado",
    description:
      "Não conseguimos identificar sua inscrição com este link. Se ainda estiver recebendo e-mails, responda a qualquer mensagem pedindo o cancelamento.",
    success: false,
  },
  erro: {
    title: "Não conseguimos cancelar agora",
    description:
      "Tivemos um problema ao processar o cancelamento. Tente novamente em alguns minutos ou responda ao e-mail para falar com a gente.",
    success: false,
  },
  padrao: {
    title: "Cancelar inscrição",
    description:
      "Use o link de cancelamento que está no rodapé de qualquer e-mail nosso. Ele desativa todos os alertas de uma vez.",
    success: false,
  },
};

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "padrao";
  const state = states[status as keyof typeof states] ?? states.padrao;

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-paper p-8 text-center sm:p-10">
        <span
          className={
            state.success
              ? "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-good-soft text-good"
              : "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cream text-muted"
          }
        >
          {state.success ? (
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
          <Link href="/" className="btn btn-primary">
            Voltar ao início
          </Link>
          <Link href="/alertas" className="btn btn-outline">
            Criar novo alerta
          </Link>
        </div>
      </div>
    </div>
  );
}
