"use server";

import { PrayerStatus } from "@bethel/db";
import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import { createPrayerRequest, deletePrayerRequest, updatePrayerRequestStatus } from "@/server/data/oracao";
import { createPrayerRequestSchema } from "@/server/validators/oracao";

type ActionResult = { success: true } | { success: false; error: string };

export async function createPrayerRequestAction(input: unknown): Promise<ActionResult> {
  const parsed = createPrayerRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId, userId } = await requireFamilySession();
  await createPrayerRequest(familyId, userId, parsed.data);
  revalidatePath("/oracao");
  return { success: true };
}

export async function updatePrayerRequestStatusAction(requestId: string, status: PrayerStatus): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();

  try {
    await updatePrayerRequestStatus(familyId, requestId, status);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar pedido." };
  }

  revalidatePath("/oracao");
  return { success: true };
}

export async function deletePrayerRequestAction(requestId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deletePrayerRequest(familyId, requestId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar pedido." };
  }
  revalidatePath("/oracao");
  return { success: true };
}
