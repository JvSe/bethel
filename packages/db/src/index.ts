import { env } from "@bethel/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client";

export * from "../prisma/generated/enums";

export function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

declare global {
  var prismaGlobal: ReturnType<typeof createPrismaClient> | undefined;
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
