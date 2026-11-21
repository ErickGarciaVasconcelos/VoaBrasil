import type { Metadata } from "next";
import Link from "next/link";
import { DemoNotice } from "@/components/demo-notice";
import {
  ArrowRightIcon,
  BellIcon,
  CheckIcon,
  ClockIcon,
  PlaneIcon,
  ShieldIcon,
  TrendingDownIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "Entenda como o Voa Leve compara preços com 90 dias de histórico, classifica as ofertas e decide quando vale a pena avisar você.",
  alternates: { canonical: "/como-funciona" },
};

const steps = [
  {
    icon: PlaneIcon,
    title: "Coletamos tarifas de parceiros",
    text: "Consultamos APIs de afiliados várias vezes ao dia para as rotas monitoradas. Sem scraping: cada tarifa vem de uma fonte declarada e rastreável.",
  },
  {
    icon: TrendingDownIcon,
    title: "Comparamos com o histórico",
    text: "Cada tarifa entra em um bucket de rota + mês de partida + duração da viagem. Calculamos mediana, percentis e dispersão de 90 dias.",
  },
  {
    icon: ShieldIcon,
    title: "Filtramos o que não presta",
    text: "Escalas demais, duração absurda, self transfer arriscado, preço abaixo do custo operacional: tudo isso é descartado antes de virar oferta.",
  },
  {
    icon: BellIcon,
    title: "Avisamos na hora certa",
    text: "Ofertas boas vão no resumo das 18h. Ótimas e excepcionais saem na hora. Excepcionais ainda passam por revisão humana.",
  },
];

const levels = [
  {
    emoji: "🟢",
    name: "Boa",
    rule: "Preço no p25 ou até 15% abaixo da mediana",
    ttl: "24 horas no ar",
    tone: "bg-good-soft text-good",
  },
  {
    emoji: "🔥",
    name: "Ótima",
    rule: "Preço no p10 ou até 30% abaixo da mediana",
    ttl: "12 horas no ar",
    tone: "bg-coral-soft text-coral",
  },
  {
    emoji: "🚨",
    name: "Excepcional",
    rule: "Preço no p01, até 55% abaixo da mediana ou queda de 40%+",
    ttl: "6 horas no ar, após revisão",
    tone: "bg-sun/20 text-[#7a5100]",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="eyebrow">Metodologia</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          Preço barato é preço fora da curva
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          “Promoção” sem contexto é marketing. O Voa Leve compara cada tarifa
          com o que a própria rota costuma custar — e só publica quando o
          desconto é estatisticamente relevante.
        </p>
        <DemoNotice className="mt-6" />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-3xl border border-line bg-paper p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-soft text-teal">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="font-display text-3xl font-extrabold text-line">
                0{index + 1}
              </span>
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <div className="max-w-2xl">
          <p className="eyebrow">Níveis de oferta</p>
          <h2 className="mt-1 font-display text-3xl font-bold">
            Três filtros, nenhum achismo
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Os cortes usam percentis do histórico do mesmo bucket. Se a rota
            ainda não tem histórico suficiente, aplicamos cold start com teto
            manual e marcamos a oferta como prévia.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-paper">
          <div className="grid grid-cols-[0.8fr_1.4fr_0.8fr] gap-3 border-b border-line bg-cream/60 px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-muted">
            <span>Nível</span>
            <span>Critério</span>
            <span>Validade</span>
          </div>
          {levels.map((level) => (
            <div
              key={level.name}
              className="grid grid-cols-[0.8fr_1.4fr_0.8fr] items-start gap-3 border-b border-line/70 px-5 py-4 text-xs last:border-0"
            >
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 font-bold ${level.tone}`}>
                <span aria-hidden>{level.emoji}</span>
                {level.name}
              </span>
              <span className="leading-5 text-ink-soft">{level.rule}</span>
              <span className="leading-5 text-muted">{level.ttl}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Ofertas excepcionais precisam de duas confirmações independentes e
          revisão humana antes de sair do rascunho.
        </p>
      </section>

      <section className="mt-16 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
          <p className="eyebrow">Cold start</p>
          <h2 className="mt-1 font-display text-2xl font-bold">
            Rota nova não fica de fora
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Enquanto uma rota não tem 60–90 dias de histórico, usamos um teto
            manual conservador definido pela curadoria. A oferta aparece com o
            selo <strong className="text-ink">prévia</strong> e não entra nos
            alertas de nível excepcional.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {[
              "Mínimo de 10 dias e 20 snapshots para sair do cold start",
              "Teto manual revisado periodicamente",
              "Revalidação a cada 6 horas",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-line bg-ink p-6 text-paper sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sun">
            Transparência
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold">
            O que não fazemos
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-paper/80">
            {[
              "Não vendemos passagens nem processamos pagamento.",
              "Não escondemos que ganhamos comissão de afiliado.",
              "Não publicamos tarifa que não passou no filtro.",
              "Não vendemos sua lista de e-mails.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sun" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/alertas" className="btn btn-primary mt-6 text-xs">
            Criar meu alerta
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-line bg-paper p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-teal" />
          <p className="eyebrow">Ciclo de vida</p>
        </div>
        <h2 className="mt-1 font-display text-2xl font-bold">
          Oferta boa não fica velha no site
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Tarifa aérea muda em minutos. Por isso cada nível tem um TTL: depois
          do prazo, a oferta sai do site e do canal automaticamente. Se o preço
          subir mais de 10% na revalidação, ela também é derrubada antes do
          vencimento.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { value: "6h", label: "excepcional" },
            { value: "12h", label: "ótima" },
            { value: "24h", label: "boa" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-cream px-4 py-4 text-center">
              <p className="font-display text-2xl font-extrabold">{item.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
