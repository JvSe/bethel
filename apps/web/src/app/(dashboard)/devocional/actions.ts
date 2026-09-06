"use server";

import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import { toggleDevotionalDay } from "@/server/data/devocional";
import { startDefaultDevotional } from "@/server/data/provision";

type ActionResult = { success: true } | { success: false; error: string };

export async function toggleDevotionalDayAction(day: number): Promise<ActionResult> {
  const { familyId, userId } = await requireFamilySession();

  try {
    await toggleDevotionalDay(familyId, userId, day);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar devocional." };
  }

  revalidatePath("/devocional");
  revalidatePath("/inicio");
  return { success: true };
}

export async function startDevotionalPlanAction(): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();

  try {
    await startDefaultDevotional(familyId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao iniciar o plano." };
  }

  revalidatePath("/devocional");
  revalidatePath("/inicio");
  return { success: true };
}
