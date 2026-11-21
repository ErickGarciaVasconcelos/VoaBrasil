import type { Metadata } from "next";
import Link from "next/link";
import { AIRPORTS } from "@ppa/db";
import { AlertForm } from "@/components/alert-form";
import {
  BellIcon,
  CheckIcon,
  ClockIcon,
  MailIcon,
  ShieldIcon,
  TelegramIcon,
  TrendingDownIcon,
} from "@/components/icons";
import { getAirports } from "@/lib/queries";
import { site } from "@/lib/site";
import type { AirportView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alertas de passagens baratas",
  description:
    "Crie um alerta gratuito e receba por e-mail quando uma passagem passar no filtro de preço do Voa Leve. Escolha rota, teto de preço e período.",
  alternates: { canonical: "/alertas" },
};

const fallbackAirports: AirportView[] = AIRPORTS.map((airport) => ({
  iata: airport.iata,
  city: airport.city,
  name: airport.name,
  state: airport.state ?? null,
  country: airport.country,
}));

const benefits = [
  {
    icon: TrendingDownIcon,
    title: "Só o que passa no filtro",
    description:
      "Nada de “promoção” que é o preço normal. O alerta só dispara quando a tarifa fica abaixo do histórico da rota.",
  },
  {
    icon: MailIcon,
    title: "E-mail direto, sem spam",
    description:
      "Ofertas boas vão no resumo das 18h. Ótimas e excepcionais saem na hora, porque duram menos.",
  },
  {
    icon: ShieldIcon,
    title: "Você manda no ritmo",
    description:
      "Confirmação por e-mail antes de entrar na lista. Cancelamento em um clique, sem precisar falar com ninguém.",
  },
];

export default async function AlertsPage() {
  let airports = fallbackAirports;
  try {
    airports = await getAirports();
  } catch (error) {
    console.error("[alertas] erro ao carregar aeroportos:", error);
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div>
          <p className="eyebrow">Alertas gratuitos</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            A passagem barata chega no seu e-mail
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
            Em vez de olhar preço todo dia, diga quanto quer pagar. O Voa Leve
            compara cada tarifa com a mediana de 90 dias da rota e só avisa
            quando vale a pena.
          </p>

          <ul className="mt-7 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal">
                  <benefit.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{benefit.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {benefit.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <BellIcon className="h-4 w-4 text-coral" />
                Como funciona
              </div>
              <ol className="mt-3 space-y-2 text-xs leading-5 text-muted">
                <li>1. Você escolhe rota, teto e período.</li>
                <li>2. Confirma o e-mail no link que enviamos.</li>
                <li>3. Avisamos quando a oferta passar no filtro.</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <ClockIcon className="h-4 w-4 text-coral" />
                Frequência
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                Ofertas boas: resumo diário às 18h. Ótimas: até 12h depois da
                detecção. Excepcionais: na hora, com revisão humana.
              </p>
            </div>
          </div>

          <a
            href={site.telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-ink p-5 text-paper transition hover:bg-ink/90"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-paper/10">
                <TelegramIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Prefere Telegram?</p>
                <p className="text-xs text-paper/70">
                  Entre no canal e receba as ofertas em tempo real.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-sun">Abrir canal →</span>
          </a>
        </div>

        <div className="lg:sticky lg:top-24">
          <AlertForm
            airports={airports}
            title="Crie seu alerta em 30 segundos"
            description="Sem cadastro, sem senha. Só o e-mail para confirmar e a rota que você quer acompanhar."
          />
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-paper p-4 text-xs leading-5 text-muted">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <p>
              Double opt-in: você só entra na lista depois de clicar no link de
              confirmação. Pode cancelar em um clique, em qualquer e-mail.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-16 rounded-3xl border border-line bg-paper p-6 sm:p-10">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <p className="eyebrow">Sem pegadinha</p>
            <h2 className="mt-1 font-display text-3xl font-bold">
              O que você não vai receber
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Alertas de passagens existem para economizar seu tempo. Se o
              serviço virar spam, ele deixa de fazer sentido.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "E-mail todo dia só para “manter o engajamento”",
              "Oferta que não passou no filtro de 90 dias",
              "Taxa escondida ou cobrança para receber o alerta",
              "Compartilhamento do seu e-mail com terceiros",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-xl bg-cream px-4 py-3 text-xs leading-5 text-ink-soft"
              >
                <span className="mt-0.5 text-teal">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Perguntas rápidas</h2>
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
          {[
            {
              q: "O alerta é realmente gratuito?",
              a: "Sim. O Voa Leve é financiado por comissões de afiliado quando você compra por nossos links, sem custo extra para você.",
            },
            {
              q: "Preciso criar conta?",
              a: "Não. Basta informar o e-mail, confirmar e escolher a rota. Você pode criar quantos alertas quiser com o mesmo endereço.",
            },
            {
              q: "Posso escolher qualquer rota?",
              a: "Você pode pedir qualquer rota, mas só avisamos quando ela estiver no radar de coleta. As rotas monitoradas aparecem em /passagens.",
            },
            {
              q: "Como cancelo?",
              a: "Todo e-mail tem um link de cancelamento. Ele desativa todos os seus alertas imediatamente.",
            },
          ].map((faq) => (
            <details key={faq.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                {faq.q}
                <span className="text-lg text-teal transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{faq.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted">
          Ao criar um alerta, você concorda com os{" "}
          <Link href="/termos" className="font-semibold text-teal underline">
            termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="font-semibold text-teal underline">
            política de privacidade
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
