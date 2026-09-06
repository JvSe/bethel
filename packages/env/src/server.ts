import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1).optional(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET precisa ter pelo menos 32 caracteres."),
    BETTER_AUTH_URL: z.url(),
    RESEND_API_KEY: isProd ? z.string().min(1) : z.string().optional(),
    EMAIL_FROM: isProd ? z.string().min(1) : z.string().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
