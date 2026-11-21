import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de uso",
  description:
    "Termos de uso do Voa Leve: serviço de indicação de ofertas de passagens aéreas, limites de responsabilidade e regras de uso.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Institucional</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          Termos de uso
        </h1>
        <p className="mt-3 text-xs text-muted">
          Última atualização: {site.lastUpdated}.
        </p>

        <div className="prose-legal mt-8">
          <p>
            Estes termos regulam o uso do site e dos alertas do {site.name}. Ao
            navegar, criar um alerta ou clicar em uma oferta, você concorda com
            as regras abaixo. Se não concordar, não utilize o serviço.
          </p>

          <h2>1. O que é o Voa Leve</h2>
          <p>
            O {site.name} é um serviço de informação e indicação de ofertas de
            passagens aéreas. Não somos companhia aérea, agência de viagens nem
            processamos pagamentos. A compra é feita diretamente no site da
            companhia ou agência indicada.
          </p>

          <h2>2. Preços e disponibilidade</h2>
          <p>
            Os preços exibidos foram observados em um momento específico e podem
            mudar a qualquer instante, inclusive antes do clique. Não
            garantimos disponibilidade, tarifa, assento, bagagem ou condição de
            pagamento. Confirme sempre o valor final no site do fornecedor antes
            de concluir a compra.
          </p>

          <h2>3. Alertas por e-mail</h2>
          <p>
            O cadastro é gratuito e exige confirmação por e-mail (double
            opt-in). Ao criar um alerta, você autoriza o envio de mensagens
            sobre ofertas que atendam aos critérios escolhidos. Você pode
            cancelar a qualquer momento pelo link presente em todos os e-mails.
          </p>
          <ul>
            <li>É necessário informar um e-mail válido e sob seu controle.</li>
            <li>Não é permitido cadastrar terceiros sem consentimento.</li>
            <li>
              Podemos suspender envios em caso de abuso, bounces ou reclamações
              de spam.
            </li>
          </ul>

          <h2>4. Links de afiliado</h2>
          <p>
            Podemos receber comissão quando você compra por um link indicado no
            site, no e-mail ou no Telegram. Isso não altera o preço pago por
            você. A divulgação completa está na{" "}
            <Link href="/divulgacao-afiliado">página de divulgação de afiliado</Link>.
          </p>

          <h2>5. Uso permitido</h2>
          <p>
            Você concorda em não usar o serviço para fins ilícitos, automatizar
            acessos de forma abusiva, tentar burlar limites de segurança,
            coletar dados de outros usuários ou reproduzir o conteúdo sem
            autorização.
          </p>

          <h2>6. Propriedade intelectual</h2>
          <p>
            Marca, layout, textos, código e base de dados do {site.name} são
            protegidos pela legislação aplicável. É proibida a reprodução
            comercial sem autorização prévia, ressalvado o uso pessoal e não
            comercial.
          </p>

          <h2>7. Limitação de responsabilidade</h2>
          <p>
            O serviço é fornecido “como está”. Não somos responsáveis por
            decisões de compra, alterações de tarifa, cancelamentos de voo,
            problemas com companhias, agências, bagagem, conexões ou qualquer
            prejuízo decorrente da contratação de terceiros.
          </p>

          <h2>8. Privacidade</h2>
          <p>
            O tratamento de dados pessoais é descrito na{" "}
            <Link href="/privacidade">política de privacidade</Link>, que faz
            parte destes termos.
          </p>

          <h2>9. Alterações</h2>
          <p>
            Podemos atualizar estes termos a qualquer momento. A versão vigente
            é sempre a publicada nesta página, com a data de atualização no
            topo. O uso contínuo após a alteração representa concordância.
          </p>

          <h2>10. Contato e foro</h2>
          <p>
            Dúvidas podem ser enviadas para{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
            Estes termos são regidos pelas leis brasileiras. Eventuais
            controvérsias serão resolvidas no foro do domicílio do consumidor,
            quando aplicável.
          </p>
        </div>
      </div>
    </div>
  );
}
