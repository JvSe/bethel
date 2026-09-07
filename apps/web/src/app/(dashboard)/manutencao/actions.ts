"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyAction } from "@/server/auth";
import { createMaintenanceItem, deleteMaintenanceItem, markMaintenanceDone } from "@/server/data/manutencao";
import { entityIdSchema } from "@/server/validators/common";
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

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await createMaintenanceItem(authz.session.familyId, parsed.data);
  revalidateManutencao();
  return { success: true };
}

export async function markMaintenanceDoneAction(itemId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(itemId);
  if (!id.success) return { success: false, error: "Item inválido." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await markMaintenanceDone(authz.session.familyId, id.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao marcar como feito." };
  }
  revalidateManutencao();
  return { success: true };
}

export async function deleteMaintenanceItemAction(itemId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(itemId);
  if (!id.success) return { success: false, error: "Item inválido." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deleteMaintenanceItem(authz.session.familyId, id.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar manutenção." };
  }
  revalidateManutencao();
  return { success: true };
}
