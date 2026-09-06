import prisma from "@bethel/db";
import { nextMaintenanceDate, type MaintenanceFrequency } from "@/lib/calc";
import type { CreateMaintenanceItemInput } from "@/server/validators/manutencao";

export async function getMaintenanceItems(familyId: string) {
  return prisma.maintenanceItem.findMany({
    where: { familyId },
    orderBy: { nextDueAt: "asc" },
  });
}

export async function createMaintenanceItem(familyId: string, input: CreateMaintenanceItemInput) {
  await prisma.maintenanceItem.create({
    data: {
      familyId,
      title: input.title,
      type: input.type,
      frequency: input.frequency,
      nextDueAt: new Date(input.nextDueAt),
    },
  });
}

export async function markMaintenanceDone(familyId: string, itemId: string) {
  const item = await prisma.maintenanceItem.findFirst({
    where: { id: itemId, familyId },
  });
  if (!item) throw new Error("Manutenção não encontrada.");

  const doneAt = new Date();
  await prisma.maintenanceItem.update({
    where: { id: item.id },
    data: {
      lastDoneAt: doneAt,
      nextDueAt: nextMaintenanceDate(doneAt, item.frequency as MaintenanceFrequency),
    },
  });
}

export async function deleteMaintenanceItem(familyId: string, itemId: string) {
  const result = await prisma.maintenanceItem.deleteMany({
    where: { id: itemId, familyId },
  });
  if (result.count === 0) throw new Error("Manutenção não encontrada.");
}
