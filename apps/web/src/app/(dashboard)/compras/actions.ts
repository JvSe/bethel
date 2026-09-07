"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyAction } from "@/server/auth";
import { createShoppingItem, deleteShoppingItem, toggleShoppingItem, clearCheckedShoppingItems } from "@/server/data/compras";
import { entityIdSchema } from "@/server/validators/common";
import { createShoppingItemSchema } from "@/server/validators/compras";
import { z } from "zod";

type ActionResult = { success: true } | { success: false; error: string };

export async function createShoppingItemAction(input: unknown): Promise<ActionResult> {
  const parsed = createShoppingItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await createShoppingItem(authz.session.familyId, parsed.data);
  revalidatePath("/compras");
  revalidatePath("/inicio");
  return { success: true };
}

export async function toggleShoppingItemAction(itemId: string, checked: boolean): Promise<ActionResult> {
  const parsed = z.object({ itemId: entityIdSchema, checked: z.boolean() }).safeParse({ itemId, checked });
  if (!parsed.success) return { success: false, error: "Item inválido." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;

  try {
    await toggleShoppingItem(authz.session.familyId, parsed.data.itemId, parsed.data.checked);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar item." };
  }

  revalidatePath("/compras");
  revalidatePath("/inicio");
  return { success: true };
}

export async function clearCheckedShoppingItemsAction(): Promise<ActionResult> {
  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await clearCheckedShoppingItems(authz.session.familyId);
  revalidatePath("/compras");
  revalidatePath("/inicio");
  return { success: true };
}

export async function deleteShoppingItemAction(itemId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(itemId);
  if (!id.success) return { success: false, error: "Item inválido." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deleteShoppingItem(authz.session.familyId, id.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar item." };
  }
  revalidatePath("/compras");
  revalidatePath("/inicio");
  return { success: true };
}
