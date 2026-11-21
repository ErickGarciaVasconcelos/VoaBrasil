import type { Metadata } from "next";
import Link from "next/link";
import { affiliateDisclosure, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Divulgação de afiliado",
  description:
    "Como o Voa Leve ganha dinheiro, quais links são de afiliado e por que isso não influencia a seleção das ofertas.",
  alternates: { canonical: "/divulgacao-afiliado" },
};

export default function AffiliatePage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Transparência</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          Divulgação de afiliado
        </h1>
        <p className="mt-3 text-xs text-muted">
          Última atualização: 21 de novembro de 2026.
        </p>

        <div className="mt-6 rounded-2xl border border-teal/20 bg-teal-soft/60 p-5 text-sm leading-6 text-ink-soft">
          {affiliateDisclosure}
        </div>

        <div className="prose-legal mt-8">
          <h2>Como o Voa Leve ganha dinheiro</h2>
          <p>
            O acesso ao site e aos alertas é gratuito. Nossa receita vem de
            comissões de afiliado: quando você clica em uma oferta e compra uma
            passagem no site do parceiro, podemos receber um percentual ou valor
            fixo. O preço que você paga é o mesmo, com ou sem o nosso link.
          </p>

          <h2>Quais links são de afiliado</h2>
          <p>
            Os botões “Ver oferta”, “Ver preço atual” e links equivalentes
            apontam para parceiros e podem conter um identificador de afiliado.
            Esses links são marcados com <code>rel="nofollow sponsored"</code>{" "}
            quando exibidos no site. Também podemos usar links de afiliado nos
            e-mails e no canal do Telegram.
          </p>

          <h2>A comissão influencia a seleção?</h2>
          <p>
            Não. A decisão de publicar uma oferta é feita pelo motor de
            detecção com base em preço, histórico, qualidade do itinerário e
            regras de nível. A comissão não entra no cálculo. Se duas ofertas
            passam no filtro, a ordem prioriza score e preço, não a comissão.
          </p>

          <h2>Por que confiar no preço</h2>
          <p>
            Toda oferta publicada passou por comparação com 90 dias de
            histórico da rota. Ofertas excepcionais têm revisão humana e duas
            confirmações. Ainda assim, tarifas mudam rápido: confirme sempre o
            valor final no site do parceiro.
          </p>

          <h2>Programas parceiros</h2>
          <p>
            Podemos participar de programas como Travelpayouts, Kiwi.com,
            companhias aéreas e agências. A lista de parceiros pode mudar sem
            aviso. A presença de um parceiro no site não significa
            recomendação além dos critérios editoriais descritos em{" "}
            <Link href="/como-funciona">como funciona</Link>.
          </p>

          <h2>Dúvidas</h2>
          <p>
            Se algo não estiver claro, escreva para{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
            Também vale ler os <Link href="/termos">termos de uso</Link> e a{" "}
            <Link href="/privacidade">política de privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
