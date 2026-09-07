import { randomUUID } from "node:crypto";
import prisma from "@bethel/db";

const WINDOW_MS = 60_000;
const MAX_MUTATIONS = 40;

export async function consumeMutationRateLimit(userId: string) {
  const key = `mutation:${userId}`;
  const now = Date.now();
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || now - Number(existing.lastRequest) > WINDOW_MS) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { id: randomUUID(), key, count: 1, lastRequest: BigInt(now) },
      update: { count: 1, lastRequest: BigInt(now) },
    });
    return false;
  }

  if (existing.count >= MAX_MUTATIONS) {
    return true;
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 }, lastRequest: BigInt(now) },
  });
  return false;
}
