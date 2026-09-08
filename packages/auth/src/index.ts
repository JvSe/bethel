import { env } from "@bethel/env/server";
import prisma from "@bethel/db";
import { APIError, betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { clipText, escapeHtml } from "./html";
import { isPasswordStrong, PASSWORD_WEAK_MESSAGE } from "./password";
import { digitsOnly, isValidPhone } from "./phone";

const AVATAR_COLOR = /^#[0-9A-Fa-f]{6}$/;

async function sendMail(params: { to: string; subject: string; html: string }) {
  try {
    if (!env.RESEND_API_KEY) {
      console.info(`[auth] ${params.subject} (${params.to})\n${params.html}`);
      return;
    }

    const from = env.EMAIL_FROM;
    if (!from) {
      console.error("[auth] EMAIL_FROM não configurado; e-mail não enviado.", params.subject, params.to);
      return;
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
      console.error("[auth] Resend recusou o e-mail", response.status, params.to, body);
    }
  } catch (error) {
    console.error("[auth] falha ao enviar e-mail", params.subject, params.to, error);
  }
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [...new Set([env.CORS_ORIGIN, env.BETTER_AUTH_URL])],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const body = ctx.body as Record<string, unknown> | undefined;
      const password =
        typeof body?.password === "string"
          ? body.password
          : typeof body?.newPassword === "string"
            ? body.newPassword
            : undefined;
      if (
        password !== undefined &&
        (ctx.path === "/sign-up/email" ||
          ctx.path === "/reset-password" ||
          ctx.path === "/change-password") &&
        !isPasswordStrong(password)
      ) {
        throw new APIError("BAD_REQUEST", { message: PASSWORD_WEAK_MESSAGE });
      }

      if (ctx.path === "/sign-up/email") {
        const phone = typeof body?.phone === "string" ? body.phone : "";
        if (!isValidPhone(phone)) {
          throw new APIError("BAD_REQUEST", { message: "Informe um telefone válido." });
        }
      }
    }),
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"],
    },
    database: {
      generateId: () => crypto.randomUUID(),
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
      phone: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const name = typeof user.name === "string" ? clipText(user.name, 80) : user.name;
          const extra = user as typeof user & { avatarColor?: unknown; phone?: unknown };
          const avatarColor =
            typeof extra.avatarColor === "string" && AVATAR_COLOR.test(extra.avatarColor)
              ? extra.avatarColor
              : "#9a958b";
          const phone = typeof extra.phone === "string" ? digitsOnly(extra.phone) : extra.phone;
          return { data: { ...user, name, avatarColor, phone } };
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
