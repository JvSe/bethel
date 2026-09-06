import prisma from "@bethel/db";
import type { CreatePantryItemInput, UpdatePantryItemInput } from "@/server/validators/despensa";

export async function getPantryItems(familyId: string) {
  const items = await prisma.pantryItem.findMany({
    where: { familyId },
    orderBy: { name: "asc" },
    include: {
      shoppingItems: {
        where: { checked: false },
        select: { id: true },
        take: 1,
      },
    },
  });

  return items.map(({ shoppingItems, ...item }) => ({
    ...item,
    onShoppingList: shoppingItems.length > 0,
  }));
}

export async function createPantryItem(familyId: string, input: CreatePantryItemInput) {
  await prisma.pantryItem.create({
    data: {
      familyId,
      name: input.name,
      quantity: input.quantity,
      category: input.category,
      level: input.level,
    },
  });
}

export async function updatePantryItem(familyId: string, itemId: string, input: UpdatePantryItemInput) {
  const result = await prisma.pantryItem.updateMany({
    where: { id: itemId, familyId },
    data: {
      quantity: input.quantity,
      level: input.level,
    },
  });
  if (result.count === 0) throw new Error("Item da despensa não encontrado.");
}

export async function deletePantryItem(familyId: string, itemId: string) {
  const result = await prisma.pantryItem.deleteMany({
    where: { id: itemId, familyId },
  });
  if (result.count === 0) throw new Error("Item da despensa não encontrado.");
}
