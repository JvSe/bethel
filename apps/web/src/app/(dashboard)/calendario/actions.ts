"use server";

import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from "@/server/data/calendario";
import { createCalendarEventSchema } from "@/server/validators/calendario";

type ActionResult = { success: true } | { success: false; error: string };

export async function createCalendarEventAction(input: unknown): Promise<ActionResult> {
  const parsed = createCalendarEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  await createCalendarEvent(familyId, parsed.data);
  revalidatePath("/calendario");
  return { success: true };
}

export async function updateCalendarEventAction(eventId: string, input: unknown): Promise<ActionResult> {
  const parsed = createCalendarEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  try {
    await updateCalendarEvent(familyId, eventId, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar evento." };
  }
  revalidatePath("/calendario");
  return { success: true };
}

export async function deleteCalendarEventAction(eventId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deleteCalendarEvent(familyId, eventId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar evento." };
  }
  revalidatePath("/calendario");
  return { success: true };
}
