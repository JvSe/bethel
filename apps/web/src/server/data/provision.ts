import prisma from "@bethel/db";

export const DEFAULT_BUDGET_CATEGORIES = [
  { name: "Mercado", monthlyLimit: "2000" },
  { name: "Moradia", monthlyLimit: "2200" },
  { name: "Contas da casa", monthlyLimit: "800" },
  { name: "Transporte", monthlyLimit: "700" },
  { name: "Lazer", monthlyLimit: "600" },
  { name: "Saúde", monthlyLimit: "500" },
] as const;

export async function provisionNewFamily(familyId: string) {
  const categoryCount = await prisma.budgetCategory.count({ where: { familyId } });
  if (categoryCount === 0) {
    await prisma.budgetCategory.createMany({
      data: DEFAULT_BUDGET_CATEGORIES.map((category) => ({
        familyId,
        name: category.name,
        monthlyLimit: category.monthlyLimit,
      })),
    });
  }
}

export async function familyNeedsProvision(familyId: string) {
  const categoryCount = await prisma.budgetCategory.count({ where: { familyId } });
  return categoryCount === 0;
}
