import prisma, { PrayerStatus } from "@bethel/db";
import type { CreatePrayerRequestInput } from "@/server/validators/oracao";

export async function getPrayerRequests(familyId: string) {
  const requests = await prisma.prayerRequest.findMany({
    where: { familyId },
    include: { author: { select: { name: true, avatarColor: true } } },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((request) => ({
    id: request.id,
    text: request.text,
    status: request.status,
    createdAt: request.createdAt,
    authorName: request.author?.name ?? null,
    authorColor: request.author?.avatarColor ?? "#9a958b",
  }));
}

export async function createPrayerRequest(familyId: string, userId: string, input: CreatePrayerRequestInput) {
  await prisma.prayerRequest.create({
    data: {
      familyId,
      text: input.text,
      authorId: userId,
    },
  });
}

export async function updatePrayerRequestStatus(familyId: string, requestId: string, status: PrayerStatus) {
  const result = await prisma.prayerRequest.updateMany({
    where: { id: requestId, familyId },
    data: { status },
  });

  if (result.count === 0) {
    throw new Error("Pedido de oração não encontrado.");
  }
}

export async function deletePrayerRequest(familyId: string, requestId: string) {
  const result = await prisma.prayerRequest.deleteMany({
    where: { id: requestId, familyId },
  });
  if (result.count === 0) throw new Error("Pedido de oração não encontrado.");
}
