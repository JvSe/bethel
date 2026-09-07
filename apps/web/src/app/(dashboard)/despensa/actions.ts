"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyAction } from "@/server/auth";
import { addPantryItemToShopping } from "@/server/data/compras";
import { createPantryItem, deletePantryItem, updatePantryItem } from "@/server/data/despensa";
import { entityIdSchema } from "@/server/validators/common";
import { createPantryItemSchema, updatePantryItemSchema } from "@/server/validators/despensa";

type ActionResult = { success: true } | { success: false; error: string };

export async function createPantryItemAction(input: unknown): Promise<ActionResult> {
  const parsed = createPantryItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await createPantryItem(authz.session.familyId, parsed.data);
  revalidatePath("/despensa");
  revalidatePath("/inicio");
  return { success: true };
}

export async function updatePantryItemAction(itemId: string, input: unknown): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(itemId);
  const parsed = updatePantryItemSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await updatePantryItem(authz.session.familyId, id.data, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar item." };
  }
  revalidatePath("/despensa");
  revalidatePath("/inicio");
  return { success: true };
}

export async function deletePantryItemAction(itemId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(itemId);
  if (!id.success) return { success: false, error: "Item inválido." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deletePantryItem(authz.session.familyId, id.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar item." };
  }
  revalidatePath("/despensa");
  revalidatePath("/inicio");
  return { success: true };
}

export async function addPantryToShoppingAction(pantryItemId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(pantryItemId);
  if (!id.success) {
    return { success: false, error: "Item inválido." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;

  try {
    await addPantryItemToShopping(authz.session.familyId, id.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao adicionar à lista." };
  }

  revalidatePath("/despensa");
  revalidatePath("/compras");
  return { success: true };
}
