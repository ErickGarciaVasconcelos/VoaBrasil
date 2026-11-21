import { signToken } from "@ppa/core";
import { authSecret, sendTransactionalEmail } from "@ppa/jobs";
import { site } from "./site";

const CONFIRM_TTL_SECONDS = 48 * 60 * 60;
const UNSUBSCRIBE_TTL_SECONDS = 365 * 24 * 60 * 60;

function tokenFor(subscriberId: string, purpose: "confirm" | "unsubscribe") {
  return signToken(
    { sub: subscriberId, purpose },
    authSecret(),
    purpose === "confirm" ? CONFIRM_TTL_SECONDS : UNSUBSCRIBE_TTL_SECONDS,
  );
}

export function confirmUrl(subscriberId: string): string {
  const token = tokenFor(subscriberId, "confirm");
  return `${site.url}/api/confirm?token=${encodeURIComponent(token)}`;
}

export function unsubscribeUrl(subscriberId: string): string {
  const token = tokenFor(subscriberId, "unsubscribe");
  return `${site.url}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendConfirmationEmail(input: {
  to: string;
  subscriberId: string;
  routeLabel?: string | null;
}): Promise<{ simulated: boolean; url: string }> {
  const url = confirmUrl(input.subscriberId);
  const route = input.routeLabel
    ? `<p style="margin:0 0 16px;color:#33475b;font-size:14px">Rota do alerta: <strong>${escapeHtml(input.routeLabel)}</strong></p>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f7f2e8;font-family:Arial,Helvetica,sans-serif;color:#0b1b2b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2e8;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf8;border:1px solid #e4dccd;border-radius:16px;overflow:hidden">
        <tr><td style="padding:20px 24px;border-bottom:1px dashed #e4dccd">
          <span style="font-size:20px;font-weight:700;letter-spacing:-0.5px">voa leve<span style="color:#ff5a36">.</span></span>
        </td></tr>
        <tr><td style="padding:24px">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#0f766e;font-weight:700">Confirme seu e-mail</p>
          <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2">Falta só um clique para ativar seu alerta</h1>
          <p style="margin:0 0 16px;color:#33475b;font-size:14px;line-height:1.6">Recebemos seu pedido de alerta de passagens. Confirme que este e-mail é seu para entrar na lista.</p>
          ${route}
          <a href="${url}" style="display:inline-block;background:#ff5a36;color:#fffdf8;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px;font-size:15px">Confirmar meu alerta</a>
          <p style="margin:20px 0 0;color:#6b7a89;font-size:12px;line-height:1.5">O link vale por 48 horas. Se você não pediu este alerta, ignore esta mensagem — nenhum e-mail será enviado.</p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f7f2e8;color:#6b7a89;font-size:11px;line-height:1.6">
          Voa Leve · alertas de passagens baratas comparadas ao histórico de 90 dias.<br>
          Dúvidas? Fale com ${escapeHtml(site.contactEmail)}.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const result = await sendTransactionalEmail({
    to: input.to,
    subject: "Confirme seu alerta de passagens · Voa Leve",
    html,
  });

  return { simulated: result.simulated, url };
}
