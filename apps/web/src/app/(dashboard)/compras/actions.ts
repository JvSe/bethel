"use server";

import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import { clearCheckedShoppingItems, createShoppingItem, deleteShoppingItem, toggleShoppingItem } from "@/server/data/compras";
import { createShoppingItemSchema } from "@/server/validators/compras";

type ActionResult = { success: true } | { success: false; error: string };

export async function createShoppingItemAction(input: unknown): Promise<ActionResult> {
  const parsed = createShoppingItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  await createShoppingItem(familyId, parsed.data);
  revalidatePath("/compras");
  revalidatePath("/inicio");
  return { success: true };
}

export async function toggleShoppingItemAction(itemId: string, checked: boolean): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();

  try {
    await toggleShoppingItem(familyId, itemId, checked);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar item." };
  }

  revalidatePath("/compras");
  revalidatePath("/inicio");
  return { success: true };
}

export async function clearCheckedShoppingItemsAction(): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  await clearCheckedShoppingItems(familyId);
  revalidatePath("/compras");
  revalidatePath("/inicio");
  return { success: true };
}

export async function deleteShoppingItemAction(itemId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deleteShoppingItem(familyId, itemId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar item." };
  }
  revalidatePath("/compras");
  revalidatePath("/inicio");
  return { success: true };
}
