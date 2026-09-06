"use server";

import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import { createGratitudeEntry, deleteGratitudeEntry } from "@/server/data/gratidao";
import { createGratitudeEntrySchema } from "@/server/validators/gratidao";

type ActionResult = { success: true } | { success: false; error: string };

export async function createGratitudeEntryAction(input: unknown): Promise<ActionResult> {
  const parsed = createGratitudeEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId, userId } = await requireFamilySession();
  await createGratitudeEntry(familyId, userId, parsed.data);
  revalidatePath("/gratidao");
  return { success: true };
}

export async function deleteGratitudeEntryAction(entryId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deleteGratitudeEntry(familyId, entryId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar gratidão." };
  }
  revalidatePath("/gratidao");
  return { success: true };
}
