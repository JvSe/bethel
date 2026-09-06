import prisma from "@bethel/db";

export const DEFAULT_BUDGET_CATEGORIES = [
  { name: "Mercado", monthlyLimit: "2000" },
  { name: "Moradia", monthlyLimit: "2200" },
  { name: "Contas da casa", monthlyLimit: "800" },
  { name: "Transporte", monthlyLimit: "700" },
  { name: "Lazer", monthlyLimit: "600" },
  { name: "Saúde", monthlyLimit: "500" },
] as const;

export const DEFAULT_DEVOTIONAL_TITLE = "Provérbios em 31 dias";

export function defaultDevotionalContent() {
  return Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    reference: `Provérbios ${i + 1}`,
  }));
}

export async function getOrCreateDefaultDevotionalPlan() {
  const existing = await prisma.devotionalPlan.findFirst({
    where: { title: DEFAULT_DEVOTIONAL_TITLE },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.devotionalPlan.create({
    data: {
      title: DEFAULT_DEVOTIONAL_TITLE,
      content: defaultDevotionalContent(),
    },
  });
}

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

  const existingDevotional = await prisma.familyDevotional.findUnique({ where: { familyId } });
  if (!existingDevotional) {
    const plan = await getOrCreateDefaultDevotionalPlan();
    await prisma.familyDevotional.create({
      data: {
        familyId,
        planId: plan.id,
        startedAt: new Date(),
      },
    });
  }
}

export async function familyNeedsProvision(familyId: string) {
  const [categoryCount, familyDevotional] = await Promise.all([
    prisma.budgetCategory.count({ where: { familyId } }),
    prisma.familyDevotional.findUnique({ where: { familyId }, select: { id: true } }),
  ]);
  return categoryCount === 0 || !familyDevotional;
}

export async function startDefaultDevotional(familyId: string) {
  const existing = await prisma.familyDevotional.findUnique({ where: { familyId } });
  if (existing) return;

  const plan = await getOrCreateDefaultDevotionalPlan();
  await prisma.familyDevotional.create({
    data: {
      familyId,
      planId: plan.id,
      startedAt: new Date(),
    },
  });
}
