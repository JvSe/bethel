import { env } from "@bethel/env/server";
import prisma from "@bethel/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";

async function sendMail(params: { to: string; subject: string; html: string }) {
  if (!env.RESEND_API_KEY) {
    console.info(`[auth] ${params.subject} (${params.to})`);
    return;
  }

  const from = env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM não configurado.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar e-mail: ${body}`);
  }
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [...new Set([env.CORS_ORIGIN, env.BETTER_AUTH_URL])],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Redefinir sua senha no Bethel",
        html: `
          <p>Olá${user.name ? `, ${user.name}` : ""}.</p>
          <p>Alguém pediu para redefinir a senha da sua conta no Bethel.</p>
          <p><a href="${url}">Clique aqui para escolher uma senha nova</a>.</p>
          <p>Se você não pediu isso, ignore este e-mail.</p>
        `,
      });
    },
  },
  user: {
    additionalFields: {
      avatarColor: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        const inviteLink = `${env.BETTER_AUTH_URL}/aceitar-convite?id=${data.id}`;
        await sendMail({
          to: data.email,
          subject: `Convite para ${data.organization.name} no Bethel`,
          html: `
            <p>${data.inviter.user.name} convidou você para a família ${data.organization.name} no Bethel.</p>
            <p><a href="${inviteLink}">Aceitar convite</a></p>
            <p>Se você não esperava este convite, ignore este e-mail.</p>
          `,
        });
      },
    }),
  ],
});
