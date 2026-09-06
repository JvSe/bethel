import prisma, { PantryLevel } from "@bethel/db";
import type { CreateShoppingItemInput } from "@/server/validators/compras";

export async function getShoppingItems(familyId: string) {
  const items = await prisma.shoppingItem.findMany({
    where: { familyId },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  return items.map((item) => ({
    ...item,
    estimatedPrice: item.estimatedPrice ? Number(item.estimatedPrice) : null,
  }));
}

export async function createShoppingItem(familyId: string, input: CreateShoppingItemInput) {
  await prisma.shoppingItem.create({
    data: {
      familyId,
      name: input.name,
      quantity: input.quantity,
      category: input.category,
      estimatedPrice: input.estimatedPrice ?? null,
    },
  });
}

export async function addPantryItemToShopping(familyId: string, pantryItemId: string) {
  const pantryItem = await prisma.pantryItem.findFirst({
    where: { id: pantryItemId, familyId },
  });
  if (!pantryItem) {
    throw new Error("Item da despensa não encontrado.");
  }
  if (pantryItem.level === PantryLevel.OK) {
    throw new Error("Só itens baixos ou esgotados entram na lista.");
  }

  const existing = await prisma.shoppingItem.findFirst({
    where: { familyId, sourcePantryItemId: pantryItemId, checked: false },
  });
  if (existing) {
    throw new Error("Este item já está na lista de compras.");
  }

  await prisma.shoppingItem.create({
    data: {
      familyId,
      name: pantryItem.name,
      quantity: pantryItem.quantity,
      category: pantryItem.category,
      sourcePantryItemId: pantryItem.id,
    },
  });
}

export async function toggleShoppingItem(familyId: string, itemId: string, checked: boolean) {
  const result = await prisma.shoppingItem.updateMany({
    where: { id: itemId, familyId },
    data: { checked },
  });

  if (result.count === 0) {
    throw new Error("Item não encontrado.");
  }
}

export async function clearCheckedShoppingItems(familyId: string) {
  await prisma.shoppingItem.deleteMany({
    where: { familyId, checked: true },
  });
}

export async function deleteShoppingItem(familyId: string, itemId: string) {
  const result = await prisma.shoppingItem.deleteMany({
    where: { id: itemId, familyId },
  });
  if (result.count === 0) throw new Error("Item não encontrado.");
}
