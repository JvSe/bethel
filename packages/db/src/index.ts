import { env } from "@bethel/env/server";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

import { PrismaClient } from "../prisma/generated/client";

export * from "../prisma/generated/enums";

if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}
neonConfig.poolQueryViaFetch = true;

function neonConnectionString(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaNeon({
      connectionString: neonConnectionString(env.DATABASE_URL),
      max: 1,
    }),
  });
}

declare global {
  var prismaGlobal: ReturnType<typeof createPrismaClient> | undefined;
}

function getPrisma() {
  if (!globalThis.prismaGlobal) {
    globalThis.prismaGlobal = createPrismaClient();
  }
  return globalThis.prismaGlobal;
}

const prisma = new Proxy({} as ReturnType<typeof createPrismaClient>, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
