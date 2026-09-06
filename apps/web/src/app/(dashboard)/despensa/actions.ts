"use server";

import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import { addPantryItemToShopping } from "@/server/data/compras";
import { createPantryItem, deletePantryItem, updatePantryItem } from "@/server/data/despensa";
import { createPantryItemSchema, updatePantryItemSchema } from "@/server/validators/despensa";

type ActionResult = { success: true } | { success: false; error: string };

export async function createPantryItemAction(input: unknown): Promise<ActionResult> {
  const parsed = createPantryItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  await createPantryItem(familyId, parsed.data);
  revalidatePath("/despensa");
  revalidatePath("/inicio");
  return { success: true };
}

export async function updatePantryItemAction(itemId: string, input: unknown): Promise<ActionResult> {
  const parsed = updatePantryItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  try {
    await updatePantryItem(familyId, itemId, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar item." };
  }
  revalidatePath("/despensa");
  revalidatePath("/inicio");
  return { success: true };
}

export async function deletePantryItemAction(itemId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deletePantryItem(familyId, itemId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar item." };
  }
  revalidatePath("/despensa");
  revalidatePath("/inicio");
  return { success: true };
}

export async function addPantryToShoppingAction(pantryItemId: string): Promise<ActionResult> {
  if (!pantryItemId.trim()) {
    return { success: false, error: "Item inválido." };
  }

  const { familyId } = await requireFamilySession();

  try {
    await addPantryItemToShopping(familyId, pantryItemId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao adicionar à lista." };
  }

  revalidatePath("/despensa");
  revalidatePath("/compras");
  return { success: true };
}
