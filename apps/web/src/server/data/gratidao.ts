import prisma from "@bethel/db";
import type { CreateGratitudeEntryInput } from "@/server/validators/gratidao";

export async function getGratitudeEntries(familyId: string) {
  const entries = await prisma.gratitudeEntry.findMany({
    where: { familyId },
    include: { author: { select: { name: true, avatarColor: true } } },
    orderBy: { date: "desc" },
  });

  return entries.map((entry) => ({
    id: entry.id,
    text: entry.text,
    date: entry.date,
    authorName: entry.author?.name ?? null,
    authorColor: entry.author?.avatarColor ?? "#9a958b",
  }));
}

export async function createGratitudeEntry(familyId: string, userId: string, input: CreateGratitudeEntryInput) {
  await prisma.gratitudeEntry.create({
    data: {
      familyId,
      text: input.text,
      authorId: userId,
      date: new Date(),
    },
  });
}

export async function deleteGratitudeEntry(
  familyId: string,
  entryId: string,
  actor: { userId: string; isOwner: boolean },
) {
  const result = await prisma.gratitudeEntry.deleteMany({
    where: actor.isOwner
      ? { id: entryId, familyId }
      : { id: entryId, familyId, authorId: actor.userId },
  });
  if (result.count === 0) throw new Error("Gratidão não encontrada.");
}
