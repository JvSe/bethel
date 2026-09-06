"use server";

import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import { createMaintenanceItem, deleteMaintenanceItem, markMaintenanceDone } from "@/server/data/manutencao";
import { createMaintenanceItemSchema } from "@/server/validators/manutencao";

type ActionResult = { success: true } | { success: false; error: string };

function revalidateManutencao() {
  revalidatePath("/manutencao");
  revalidatePath("/inicio");
}

export async function createMaintenanceItemAction(input: unknown): Promise<ActionResult> {
  const parsed = createMaintenanceItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  await createMaintenanceItem(familyId, parsed.data);
  revalidateManutencao();
  return { success: true };
}

export async function markMaintenanceDoneAction(itemId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await markMaintenanceDone(familyId, itemId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao marcar como feito." };
  }
  revalidateManutencao();
  return { success: true };
}

export async function deleteMaintenanceItemAction(itemId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deleteMaintenanceItem(familyId, itemId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar manutenção." };
  }
  revalidateManutencao();
  return { success: true };
}
