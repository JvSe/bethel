import { env } from "@bethel/env/server";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../prisma/generated/client";

export * from "../prisma/generated/enums";

export function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }),
  });
}

declare global {
  var prismaGlobal: ReturnType<typeof createPrismaClient> | undefined;
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
