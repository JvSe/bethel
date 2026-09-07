"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyAction } from "@/server/auth";
import { createPrayerRequest, deletePrayerRequest, updatePrayerRequestStatus } from "@/server/data/oracao";
import { entityIdSchema } from "@/server/validators/common";
import { createPrayerRequestSchema, prayerStatusSchema } from "@/server/validators/oracao";

type ActionResult = { success: true } | { success: false; error: string };

export async function createPrayerRequestAction(input: unknown): Promise<ActionResult> {
  const parsed = createPrayerRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await createPrayerRequest(authz.session.familyId, authz.session.userId, parsed.data);
  revalidatePath("/oracao");
  return { success: true };
}

export async function updatePrayerRequestStatusAction(requestId: string, status: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(requestId);
  const parsedStatus = prayerStatusSchema.safeParse(status);
  if (!id.success || !parsedStatus.success) {
    return { success: false, error: "Pedido inválido." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;

  try {
    await updatePrayerRequestStatus(authz.session.familyId, id.data, parsedStatus.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar pedido." };
  }

  revalidatePath("/oracao");
  return { success: true };
}

export async function deletePrayerRequestAction(requestId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(requestId);
  if (!id.success) return { success: false, error: "Pedido inválido." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deletePrayerRequest(authz.session.familyId, id.data, {
      userId: authz.session.userId,
      isOwner: authz.session.isOwner,
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar pedido." };
  }
  revalidatePath("/oracao");
  return { success: true };
}
