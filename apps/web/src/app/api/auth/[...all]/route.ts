import { auth } from "@bethel/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

function logAuthContext(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const betterAuthUrl = process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? null;
  if (betterAuthUrl && betterAuthUrl !== requestOrigin) {
    console.error("[auth] BETTER_AUTH_URL diferente do endereço do site", {
      betterAuthUrl,
      corsOrigin: process.env.CORS_ORIGIN ?? null,
      requestOrigin,
    });
  }
}

async function handle(method: "GET" | "POST", request: Request) {
  try {
    logAuthContext(request);
    return await handler[method](request);
  } catch (error) {
    console.error(`[auth] ${method} ${new URL(request.url).pathname}`, error, {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasSecret: Boolean(process.env.BETTER_AUTH_SECRET),
      hasResend: Boolean(process.env.RESEND_API_KEY),
      hasEmailFrom: Boolean(process.env.EMAIL_FROM),
      betterAuthUrl: process.env.BETTER_AUTH_URL ?? null,
      corsOrigin: process.env.CORS_ORIGIN ?? null,
    });
    return Response.json({ message: "Erro interno ao autenticar." }, { status: 500 });
  }
}

export const GET = (request: Request) => handle("GET", request);
export const POST = (request: Request) => handle("POST", request);
