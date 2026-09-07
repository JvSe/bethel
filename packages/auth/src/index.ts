import { env } from "@bethel/env/server";
import prisma from "@bethel/db";
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { clipText, escapeHtml } from "./html";

const AVATAR_COLOR = /^#[0-9A-Fa-f]{6}$/;

async function sendMail(params: { to: string; subject: string; html: string }) {
  if (!env.RESEND_API_KEY) {
    console.info(`[auth] ${params.subject} (${params.to})\n${params.html}`);
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
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"],
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
      "/forget-password": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const name = escapeHtml(user.name);
      await sendMail({
        to: user.email,
        subject: "Confirme seu e-mail no Bethel",
        html: `
          <p>Olá${name ? `, ${name}` : ""}.</p>
          <p>Confirme seu e-mail para usar o Bethel.</p>
          <p><a href="${url}">Confirmar e-mail</a></p>
          <p>Se você não criou esta conta, ignore este e-mail.</p>
        `,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const name = escapeHtml(user.name);
      await sendMail({
        to: user.email,
        subject: "Redefinir sua senha no Bethel",
        html: `
          <p>Olá${name ? `, ${name}` : ""}.</p>
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
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const name = typeof user.name === "string" ? clipText(user.name, 80) : user.name;
          const extra = user as typeof user & { avatarColor?: unknown };
          const avatarColor =
            typeof extra.avatarColor === "string" && AVATAR_COLOR.test(extra.avatarColor)
              ? extra.avatarColor
              : "#9a958b";
          return { data: { ...user, name, avatarColor } };
        },
      },
    },
  },
  plugins: [
    organization({
      requireEmailVerificationOnInvitation: true,
      async sendInvitationEmail(data) {
        const inviteLink = `${env.BETTER_AUTH_URL}/aceitar-convite?id=${encodeURIComponent(data.id)}`;
        const inviterName = escapeHtml(data.inviter.user.name);
        const familyName = escapeHtml(data.organization.name);
        await sendMail({
          to: data.email,
          subject: `Convite para ${familyName} no Bethel`,
          html: `
            <p>${inviterName} convidou você para a família ${familyName} no Bethel.</p>
            <p><a href="${inviteLink}">Aceitar convite</a></p>
            <p>Se você não esperava este convite, ignore este e-mail.</p>
          `,
        });
      },
      organizationHooks: {
        async beforeCreateOrganization({ organization }) {
          const name =
            typeof organization.name === "string" ? clipText(organization.name, 80) : organization.name;
          return { data: { ...organization, name } };
        },
        async beforeCreateInvitation({ invitation }) {
          return { data: { ...invitation, role: "member" } };
        },
        async beforeAcceptInvitation({ user }) {
          if (!user.emailVerified) {
            throw new APIError("FORBIDDEN", {
              message: "Confirme seu e-mail antes de aceitar o convite.",
            });
          }
        },
      },
    }),
  ],
});
