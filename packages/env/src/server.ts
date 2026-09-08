import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

const BUILD_FALLBACKS = {
  DATABASE_URL: "postgresql://build:build@127.0.0.1:5432/build",
  CORS_ORIGIN: "https://bethel.build",
  BETTER_AUTH_SECRET: "build-time-placeholder-secret-min-32-chars",
  BETTER_AUTH_URL: "https://bethel.build",
  RESEND_API_KEY: "re_build_placeholder",
  EMAIL_FROM: "Bethel <build@bethel.build>",
} as const;

function withoutTrailingSlash(value: string | undefined) {
  return value?.replace(/\/+$/, "") || value;
}

function createServerEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const isNextBuild = process.env.NEXT_PHASE === "phase-production-build";

  function buildOrReal(name: keyof typeof BUILD_FALLBACKS) {
    return process.env[name] || (isNextBuild ? BUILD_FALLBACKS[name] : process.env[name]);
  }

  return createEnv({
    server: {
      DATABASE_URL: z.string().min(1),
      DIRECT_URL: z.string().min(1).optional(),
      CORS_ORIGIN: z.url(),
      NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
      BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET precisa ter pelo menos 32 caracteres."),
      BETTER_AUTH_URL: z.url(),
      RESEND_API_KEY: isProd && !isNextBuild ? z.string().min(1) : z.string().optional(),
      EMAIL_FROM: isProd && !isNextBuild ? z.string().min(1) : z.string().optional(),
    },
    runtimeEnv: {
      DATABASE_URL: buildOrReal("DATABASE_URL"),
      DIRECT_URL: process.env.DIRECT_URL,
      CORS_ORIGIN: withoutTrailingSlash(buildOrReal("CORS_ORIGIN")),
      NODE_ENV: process.env.NODE_ENV,
      BETTER_AUTH_SECRET: buildOrReal("BETTER_AUTH_SECRET"),
      BETTER_AUTH_URL: withoutTrailingSlash(buildOrReal("BETTER_AUTH_URL")),
      RESEND_API_KEY: buildOrReal("RESEND_API_KEY"),
      EMAIL_FROM: buildOrReal("EMAIL_FROM"),
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    emptyStringAsUndefined: true,
  });
}

type ServerEnv = ReturnType<typeof createServerEnv>;

let cached: ServerEnv | undefined;

function getServerEnv() {
  cached ??= createServerEnv();
  return cached;
}

// Cloudflare só copia os secrets para process.env no primeiro request.
// Proxy evita validar env na importação do Worker, antes disso.
export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop) {
    return getServerEnv()[prop as keyof ServerEnv];
  },
});
