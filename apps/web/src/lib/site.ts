export const site = {
  name: process.env.SITE_NAME?.trim() || "Voa Leve",
  url: (process.env.SITE_URL?.trim() || "http://localhost:3000").replace(
    /\/+$/,
    "",
  ),
  tagline: "Passagens baratas, sem enrolação.",
  description:
    "Alertas de passagens aéreas baratas com preço comparado a 90 dias de histórico. Ofertas nacionais e internacionais, sem taxa e sem letra miúda.",
  telegramUrl:
    process.env.TELEGRAM_PUBLIC_URL?.trim() || "https://t.me/voaleve",
  contactEmail:
    process.env.CONTACT_EMAIL?.trim() || "contato@voaleve.com.br",
  lastUpdated: "21 de novembro de 2026",
};

export const affiliateDisclosure =
  "O Voa Leve é um serviço de indicação. Não vendemos passagens e não processamos pagamentos. Podemos receber comissão de afiliado quando você compra por um dos nossos links, sem custo adicional para você.";
