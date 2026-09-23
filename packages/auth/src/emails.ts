import { escapeHtml } from "./html";

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const FONT_HEADING = "Georgia, 'Times New Roman', serif";

type EmailCta = {
  href: string;
  label: string;
};

type EmailLayout = {
  preheader: string;
  kicker: string;
  title: string;
  introHtml: string;
  cta?: EmailCta;
  afterHtml?: string;
  footerNote: string;
};

function emailLayout(content: EmailLayout) {
  const cta = content.cta
    ? `
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px;">
                        <tr>
                          <td align="center" bgcolor="#4f8a6b" style="border-radius: 12px; background: #4f8a6b;">
                            <a href="${escapeHtml(content.cta.href)}" target="_blank" style="display: inline-block; padding: 14px 22px; font-family: ${FONT}; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 12px;">
                              ${escapeHtml(content.cta.label)}
                            </a>
                          </td>
                        </tr>
                      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Bethel</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f6f5f1; font-family: ${FONT}; color: #2a2722;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
      ${escapeHtml(content.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f6f5f1;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px;">
            <tr>
              <td style="padding: 0 8px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="38" height="38" align="center" valign="middle" bgcolor="#4f8a6b" style="width: 38px; height: 38px; background: #4f8a6b; border-radius: 11px; color: #ffffff; font-family: ${FONT_HEADING}; font-size: 18px; font-weight: 700; line-height: 38px;">
                      B
                    </td>
                    <td style="padding-left: 10px;">
                      <div style="font-family: ${FONT_HEADING}; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #2a2722; line-height: 1;">Bethel</div>
                      <div style="font-size: 12px; line-height: 1.3; color: #9a958b; padding-top: 3px; font-family: ${FONT};">Gestão do lar</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background: #ffffff; border: 1px solid #ece9e2; border-radius: 16px; padding: 36px 32px 32px; box-shadow: 0 1px 2px rgba(30, 28, 24, 0.03);">
                <p style="margin: 0 0 10px; font-family: ${FONT}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #4f8a6b;">
                  ${escapeHtml(content.kicker)}
                </p>
                <h1 style="margin: 0 0 18px; font-family: ${FONT_HEADING}; font-size: 26px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.25; color: #2a2722;">
                  ${escapeHtml(content.title)}
                </h1>
                ${content.introHtml}
                ${cta}
                ${content.afterHtml ?? ""}
                <p style="margin: 0; font-family: ${FONT}; font-size: 13px; line-height: 1.55; color: #9a958b;">
                  ${escapeHtml(content.footerNote)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 22px 8px 0; font-family: ${FONT}; font-size: 12px; line-height: 1.5; color: #9a958b;">
                Bethel — um lar organizado, uma fé compartilhada.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function greetingHtml(name?: string) {
  const safe = name?.trim() ? escapeHtml(name.trim()) : "";
  return safe ? `Olá, ${safe}.` : "Olá.";
}

function greetingText(name?: string) {
  const safe = name?.trim();
  return safe ? `Olá, ${safe}.` : "Olá.";
}

function paragraph(html: string) {
  return `<p style="margin: 0 0 22px; font-family: ${FONT}; font-size: 15px; line-height: 1.6; color: #2a2722;">${html}</p>`;
}

function detailRow(label: string, valueHtml: string, preWrap = false) {
  return `
                    <tr>
                      <td style="padding: 0 0 12px;">
                        <p style="margin: 0 0 4px; font-family: ${FONT}; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #9a958b;">${escapeHtml(label)}</p>
                        <p style="margin: 0; font-family: ${FONT}; font-size: 14px; line-height: 1.55; color: #2a2722;${preWrap ? " white-space: pre-wrap;" : ""}">${valueHtml}</p>
                      </td>
                    </tr>`;
}

export function verificationEmailHtml(params: { name?: string; url: string }) {
  return emailLayout({
    preheader: "Confirme seu e-mail para usar o Bethel.",
    kicker: "Confirmação de e-mail",
    title: "Confirme seu e-mail",
    introHtml: [
      paragraph(greetingHtml(params.name)),
      paragraph("Falta só um passo para usar o Bethel com a sua família. Confirme este e-mail para entrar, criar o lar e aceitar convites."),
    ].join(""),
    cta: { href: params.url, label: "Confirmar e-mail" },
    afterHtml: paragraph(
      `Se o botão não abrir, copie e cole este link no navegador:<br /><a href="${escapeHtml(params.url)}" style="color: #4f8a6b; word-break: break-all;">${escapeHtml(params.url)}</a>`,
    ),
    footerNote: "Se você não criou esta conta, pode ignorar este e-mail.",
  });
}

export function resetPasswordEmailHtml(params: { name?: string; url: string }) {
  return emailLayout({
    preheader: "Escolha uma senha nova para a sua conta no Bethel.",
    kicker: "Redefinição de senha",
    title: "Redefinir sua senha",
    introHtml: [
      paragraph(greetingHtml(params.name)),
      paragraph("Recebemos um pedido para redefinir a senha da sua conta no Bethel. O link vale por pouco tempo e só pode ser usado uma vez."),
    ].join(""),
    cta: { href: params.url, label: "Escolher senha nova" },
    afterHtml: paragraph(
      `Se o botão não abrir, copie e cole este link no navegador:<br /><a href="${escapeHtml(params.url)}" style="color: #4f8a6b; word-break: break-all;">${escapeHtml(params.url)}</a>`,
    ),
    footerNote: "Se você não pediu isso, ignore este e-mail. Sua senha continua a mesma.",
  });
}

export function invitationEmailHtml(params: {
  inviterName: string;
  familyName: string;
  url: string;
}) {
  const inviter = escapeHtml(params.inviterName);
  const family = escapeHtml(params.familyName);

  return emailLayout({
    preheader: `${params.inviterName} convidou você para ${params.familyName} no Bethel.`,
    kicker: "Convite da família",
    title: "Você foi convidado",
    introHtml: [
      paragraph(`${inviter} convidou você para a família <strong>${family}</strong> no Bethel.`),
      paragraph("Aceite o convite para ver as contas da casa, as tarefas e a vida de fé da família no mesmo lugar."),
    ].join(""),
    cta: { href: params.url, label: "Aceitar convite" },
    afterHtml: paragraph(
      `Se o botão não abrir, copie e cole este link no navegador:<br /><a href="${escapeHtml(params.url)}" style="color: #4f8a6b; word-break: break-all;">${escapeHtml(params.url)}</a>`,
    ),
    footerNote: "Se você não esperava este convite, pode ignorar este e-mail.",
  });
}

export function contactEmailHtml(params: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const phone = params.phone?.trim();
  const message = escapeHtml(params.message).replace(/\n/g, "<br />");

  return emailLayout({
    preheader: `Nova mensagem de ${params.name}.`,
    kicker: "Contato",
    title: "Nova mensagem",
    introHtml: `${paragraph("Alguém enviou uma mensagem pelo Bethel.")}
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px; background: #f5f3ee; border: 1px solid #ece9e2; border-radius: 12px;">
                    <tr>
                      <td style="padding: 18px 18px 6px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          ${detailRow("Nome", escapeHtml(params.name))}
                          ${detailRow("E-mail", `<a href="mailto:${escapeHtml(params.email)}" style="color: #4f8a6b; text-decoration: none;">${escapeHtml(params.email)}</a>`)}
                          ${phone ? detailRow("Telefone", escapeHtml(phone)) : ""}
                          ${detailRow("Mensagem", message, true)}
                        </table>
                      </td>
                    </tr>
                  </table>`,
    footerNote: "Responda diretamente a este e-mail para falar com quem enviou a mensagem.",
  });
}

export const emailSubjects = {
  verification: "Confirme seu e-mail no Bethel",
  resetPassword: "Redefinir sua senha no Bethel",
  invitation: (familyName: string) => `Convite para ${familyName} no Bethel`,
  contact: (name: string) => `Contato de ${name} — Bethel`,
} as const;

export function verificationEmail(params: { name?: string; url: string }) {
  return {
    subject: emailSubjects.verification,
    html: verificationEmailHtml(params),
    text: `${greetingText(params.name)}

Falta só um passo para usar o Bethel com a sua família. Confirme este e-mail para entrar, criar o lar e aceitar convites.

${params.url}

Se você não criou esta conta, pode ignorar este e-mail.

Bethel — um lar organizado, uma fé compartilhada.`,
  };
}

export function resetPasswordEmail(params: { name?: string; url: string }) {
  return {
    subject: emailSubjects.resetPassword,
    html: resetPasswordEmailHtml(params),
    text: `${greetingText(params.name)}

Recebemos um pedido para redefinir a senha da sua conta no Bethel. O link vale por pouco tempo e só pode ser usado uma vez.

${params.url}

Se você não pediu isso, ignore este e-mail. Sua senha continua a mesma.

Bethel — um lar organizado, uma fé compartilhada.`,
  };
}

export function invitationEmail(params: {
  inviterName: string;
  familyName: string;
  url: string;
}) {
  return {
    subject: emailSubjects.invitation(params.familyName),
    html: invitationEmailHtml(params),
    text: `${params.inviterName} convidou você para a família ${params.familyName} no Bethel.

Aceite o convite para ver as contas da casa, as tarefas e a vida de fé da família no mesmo lugar.

${params.url}

Se você não esperava este convite, pode ignorar este e-mail.

Bethel — um lar organizado, uma fé compartilhada.`,
  };
}

export function contactEmail(params: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const phone = params.phone?.trim();
  return {
    subject: emailSubjects.contact(params.name),
    html: contactEmailHtml(params),
    text: `Nova mensagem de contato no Bethel.

Nome: ${params.name}
E-mail: ${params.email}${phone ? `\nTelefone: ${phone}` : ""}

Mensagem:
${params.message}

Bethel — um lar organizado, uma fé compartilhada.`,
  };
}
