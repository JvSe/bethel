import prisma from "@bethel/db";

export const DEFAULT_BUDGET_CATEGORIES = [
  { name: "Mercado", monthlyLimit: "2000", currency: "BRL" as const },
  { name: "Moradia", monthlyLimit: "2200", currency: "BRL" as const },
  { name: "Contas da casa", monthlyLimit: "800", currency: "BRL" as const },
  { name: "Transporte", monthlyLimit: "700", currency: "BRL" as const },
  { name: "Lazer", monthlyLimit: "600", currency: "BRL" as const },
  { name: "Saúde", monthlyLimit: "500", currency: "BRL" as const },
] as const;

export const DEFAULT_FINANCIAL_ACCOUNTS = [
  { name: "Conta principal (R$)", currency: "BRL" as const },
] as const;

/** Garante pelo menos uma conta financeira. Seguro chamar a qualquer momento. */
export async function ensureFinancialAccounts(familyId: string) {
  const accountCount = await prisma.financialAccount.count({ where: { familyId } });
  if (accountCount > 0) return;

  await prisma.financialAccount.createMany({
    data: DEFAULT_FINANCIAL_ACCOUNTS.map((account) => ({
      familyId,
      name: account.name,
      currency: account.currency,
    })),
  });
}

/** Seed inicial de categorias — só no onboarding, não ao apagar tudo depois. */
export async function seedDefaultBudgetCategories(familyId: string) {
  const categoryCount = await prisma.budgetCategory.count({ where: { familyId } });
  if (categoryCount > 0) return;

  await prisma.budgetCategory.createMany({
    data: DEFAULT_BUDGET_CATEGORIES.map((category) => ({
      familyId,
      name: category.name,
      monthlyLimit: category.monthlyLimit,
      currency: category.currency,
    })),
  });
}

/** Setup completo da família nova (onboarding). */
export async function provisionNewFamily(familyId: string) {
  await ensureFinancialAccounts(familyId);
  await seedDefaultBudgetCategories(familyId);
}

/** Família sem conta financeira ainda — precisa de setup mínimo. */
export async function familyNeedsProvision(familyId: string) {
  const accountCount = await prisma.financialAccount.count({ where: { familyId } });
  return accountCount === 0;
}

/** Defaults seguros em páginas de finanças: só contas, nunca recria orçamento. */
export async function ensureFamilyFinanceDefaults(familyId: string) {
  await ensureFinancialAccounts(familyId);
}
