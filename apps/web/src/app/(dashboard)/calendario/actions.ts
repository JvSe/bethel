"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyAction } from "@/server/auth";
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from "@/server/data/calendario";
import { entityIdSchema } from "@/server/validators/common";
import { createCalendarEventSchema } from "@/server/validators/calendario";

type ActionResult = { success: true } | { success: false; error: string };

export async function createCalendarEventAction(input: unknown): Promise<ActionResult> {
  const parsed = createCalendarEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await createCalendarEvent(authz.session.familyId, parsed.data);
  revalidatePath("/calendario");
  return { success: true };
}

export async function updateCalendarEventAction(eventId: string, input: unknown): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(eventId);
  const parsed = createCalendarEventSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await updateCalendarEvent(authz.session.familyId, id.data, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar evento." };
  }
  revalidatePath("/calendario");
  return { success: true };
}

export async function deleteCalendarEventAction(eventId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(eventId);
  if (!id.success) return { success: false, error: "Evento inválido." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deleteCalendarEvent(authz.session.familyId, id.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar evento." };
  }
  revalidatePath("/calendario");
  return { success: true };
}
