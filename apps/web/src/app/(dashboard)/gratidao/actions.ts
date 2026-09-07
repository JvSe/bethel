"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyAction } from "@/server/auth";
import { createGratitudeEntry, deleteGratitudeEntry } from "@/server/data/gratidao";
import { entityIdSchema } from "@/server/validators/common";
import { createGratitudeEntrySchema } from "@/server/validators/gratidao";

type ActionResult = { success: true } | { success: false; error: string };

export async function createGratitudeEntryAction(input: unknown): Promise<ActionResult> {
  const parsed = createGratitudeEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await createGratitudeEntry(authz.session.familyId, authz.session.userId, parsed.data);
  revalidatePath("/gratidao");
  return { success: true };
}

export async function deleteGratitudeEntryAction(entryId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(entryId);
  if (!id.success) return { success: false, error: "Gratidão inválida." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deleteGratitudeEntry(authz.session.familyId, id.data, {
      userId: authz.session.userId,
      isOwner: authz.session.isOwner,
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar gratidão." };
  }
  revalidatePath("/gratidao");
  return { success: true };
}
