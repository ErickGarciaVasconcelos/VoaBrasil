import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Como o Voa Leve coleta, usa, armazena e protege seus dados pessoais, em conformidade com a LGPD.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Institucional</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          Privacidade e LGPD
        </h1>
        <p className="mt-3 text-xs text-muted">
          Última atualização: 21 de novembro de 2026.
        </p>

        <div className="prose-legal mt-8">
          <p>
            Esta política explica como o {site.name} trata dados pessoais, em
            linha com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            Coletamos o mínimo necessário para enviar alertas de passagens e
            medir o desempenho das ofertas.
          </p>

          <h2>1. Quem é o controlador</h2>
          <p>
            O controlador dos dados é o responsável pelo {site.name}, com
            contato em{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
          </p>

          <h2>2. Quais dados coletamos</h2>
          <ul>
            <li>
              <strong>Dados de alerta:</strong> e-mail, rota de interesse, teto
              de preço, período de viagem e status de confirmação.
            </li>
            <li>
              <strong>Dados de uso:</strong> cliques em ofertas, canal de
              origem, página de referência, data e hora.
            </li>
            <li>
              <strong>Dados técnicos:</strong> endereço IP e user agent,
              armazenados de forma pseudonimizada (hash) para segurança e
              prevenção de abuso.
            </li>
            <li>
              <strong>Cookies essenciais:</strong> cookie de sessão do painel
              administrativo, restrito à equipe.
            </li>
          </ul>

          <h2>3. Para que usamos</h2>
          <ul>
            <li>Enviar os alertas que você pediu e confirmou.</li>
            <li>Entender quais ofertas e canais funcionam melhor.</li>
            <li>Prevenir fraude, spam e abuso do formulário.</li>
            <li>Cumprir obrigações legais e responder solicitações.</li>
          </ul>

          <h2>4. Base legal</h2>
          <p>
            O envio de alertas é baseado no seu <strong>consentimento</strong>,
            coletado no formulário e confirmado por e-mail. O tratamento de
            dados de uso e segurança se apoia no{" "}
            <strong>legítimo interesse</strong> em operar e proteger o serviço.
            Dados de acesso ao painel são tratados para execução do serviço.
          </p>

          <h2>5. Compartilhamento</h2>
          <p>
            Podemos compartilhar dados estritamente necessários com:
          </p>
          <ul>
            <li>Provedor de envio de e-mail transacional (ex.: Resend).</li>
            <li>Provedor de hospedagem e banco de dados.</li>
            <li>
              Plataformas de afiliados, quando você clica em uma oferta, para
              atribuição da comissão.
            </li>
            <li>Autoridades, quando houver obrigação legal.</li>
          </ul>
          <p>
            Não vendemos, alugamos ou cedemos sua lista de e-mails para
            terceiros.
          </p>

          <h2>6. Retenção</h2>
          <p>
            Mantemos o e-mail enquanto o alerta estiver ativo ou enquanto
            necessário para cumprir obrigações legais. Após o descadastro, os
            alertas são desativados e o e-mail é mantido em lista de supressão
            para garantir que você não receba novas mensagens. Dados de cliques
            são mantidos de forma agregada ou pseudonimizada.
          </p>

          <h2>7. Seus direitos</h2>
          <p>
            Você pode solicitar confirmação de tratamento, acesso, correção,
            anonimização, portabilidade, eliminação, informação sobre
            compartilhamento e revogação do consentimento. Basta escrever para{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
            Responderemos dentro dos prazos legais.
          </p>

          <h2>8. Segurança</h2>
          <p>
            Adotamos medidas técnicas e administrativas razoáveis, como HTTPS,
            senhas de painel fora do código, tokens assinados para confirmação
            e descadastro, e acesso restrito ao banco. Nenhum sistema é
            totalmente imune; em caso de incidente relevante, comunicaremos os
            titulares e a ANPD conforme a lei.
          </p>

          <h2>9. Cookies</h2>
          <p>
            O site público não usa cookies de publicidade ou rastreamento de
            terceiros. O cookie <code>ppa_admin</code> é essencial para a
            sessão do painel e não é enviado a visitantes.
          </p>

          <h2>10. Alterações e contato</h2>
          <p>
            Esta política pode ser atualizada. A data no topo indica a versão
            vigente. Para dúvidas, consulte também os{" "}
            <Link href="/termos">termos de uso</Link> ou escreva para{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
