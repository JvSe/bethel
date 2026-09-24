import prisma, { ContributionType, Currency, IncomeCategory, TransactionType } from "@bethel/db";
import { budgetProgress, titheGoalProgress } from "@/lib/calc";
import { ensureFamilyFinanceDefaults } from "@/server/data/provision";
import type {
  CreateBillInput,
  CreateBudgetCategoryInput,
  CreateContributionInput,
  CreateFinancialAccountInput,
  CreateRecurringIncomeInput,
  CreateTransactionInput,
  UpdateRecurringIncomeInput,
} from "@/server/validators/financas";

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfNextMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

const CONTRIBUTION_LABELS: Record<ContributionType, string> = {
  TITHE: "Dízimo",
  OFFERING: "Oferta de gratidão",
  MISSIONS: "Missões",
};

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  SALARY: "Salário",
  FREELANCE: "Freelance",
  RENT: "Aluguel",
  OTHER: "Outros",
};

function emptyCurrencyTotals() {
  return {
    BRL: { income: 0, expense: 0, balance: 0 },
    USD: { income: 0, expense: 0, balance: 0 },
  } as Record<Currency, { income: number; expense: number; balance: number }>;
}

async function assertAccountInFamily(familyId: string, accountId: string) {
  const account = await prisma.financialAccount.findFirst({
    where: { id: accountId, familyId },
    select: { id: true, currency: true },
  });
  if (!account) throw new Error("Conta financeira inválida.");
  return account;
}

async function assertCategoryInFamily(familyId: string, categoryId: string | null | undefined) {
  if (!categoryId) return null;
  const category = await prisma.budgetCategory.findFirst({
    where: { id: categoryId, familyId },
    select: { id: true, currency: true },
  });
  if (!category) throw new Error("Categoria inválida.");
  return category;
}

async function ensureRecurringIncomesForMonth(familyId: string) {
  try {
    const monthStart = startOfMonth();
    const monthEnd = startOfNextMonth();
    const recurring = await prisma.recurringIncome.findMany({
      where: { familyId, active: true },
      include: { account: { select: { id: true } } },
    });
    if (recurring.length === 0) return;

    const existing = await prisma.transaction.findMany({
      where: {
        familyId,
        recurringIncomeId: { in: recurring.map((r) => r.id) },
        date: { gte: monthStart, lt: monthEnd },
      },
      select: { recurringIncomeId: true },
    });
    const alreadyCreated = new Set(existing.map((t) => t.recurringIncomeId).filter(Boolean));

    const year = monthStart.getFullYear();
    const monthIndex = monthStart.getMonth();

    for (const item of recurring) {
      if (alreadyCreated.has(item.id)) continue;
      if (item.skippedYear === year && item.skippedMonth === monthIndex + 1) continue;
      const day = Math.min(Math.max(item.dayOfMonth, 1), 28);
      await prisma.transaction.create({
        data: {
          familyId,
          accountId: item.accountId,
          description: item.description,
          amount: item.amount,
          type: TransactionType.INCOME,
          date: new Date(year, monthIndex, day),
          incomeCategory: item.category,
          recurringIncomeId: item.id,
        },
      });
    }
  } catch (error) {
    console.error("[financas] ensureRecurringIncomesForMonth", error);
  }
}

export async function getFinanceOverview(familyId: string) {
  await ensureFamilyFinanceDefaults(familyId);
  await ensureRecurringIncomesForMonth(familyId);

  const monthStart = startOfMonth();
  const monthEnd = startOfNextMonth();

  const [accounts, categories, transactionsThisMonth, allTransactions, contributions, bills, recurringIncomes] =
    await Promise.all([
      prisma.financialAccount.findMany({ where: { familyId }, orderBy: [{ currency: "asc" }, { name: "asc" }] }),
      prisma.budgetCategory.findMany({ where: { familyId }, orderBy: { name: "asc" } }),
      prisma.transaction.findMany({
        where: { familyId, date: { gte: monthStart, lt: monthEnd } },
        include: { account: { select: { id: true, currency: true, name: true } } },
      }),
      prisma.transaction.findMany({
        where: { familyId },
        include: {
          category: { select: { name: true } },
          account: { select: { id: true, name: true, currency: true } },
        },
        orderBy: { date: "desc" },
      }),
      prisma.contribution.findMany({
        where: { familyId },
        include: { account: { select: { id: true, name: true, currency: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.bill.findMany({
        where: { familyId },
        include: { account: { select: { id: true, name: true, currency: true } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.recurringIncome.findMany({
        where: { familyId },
        include: { account: { select: { id: true, name: true, currency: true } } },
        orderBy: { description: "asc" },
      }),
    ]);

  const byCurrency = emptyCurrencyTotals();
  const accountMonth = new Map<string, { income: number; expense: number }>();

  for (const t of transactionsThisMonth) {
    if (!t.account) continue;
    const amount = Number(t.amount);
    const currency = t.account.currency;
    const bucket = accountMonth.get(t.accountId) ?? { income: 0, expense: 0 };
    if (t.type === TransactionType.INCOME) {
      byCurrency[currency].income += amount;
      bucket.income += amount;
    } else {
      byCurrency[currency].expense += amount;
      bucket.expense += amount;
    }
    accountMonth.set(t.accountId, bucket);
  }

  for (const currency of Object.keys(byCurrency) as Currency[]) {
    byCurrency[currency].balance = byCurrency[currency].income - byCurrency[currency].expense;
  }

  const spentByCategory = new Map<string, number>();
  for (const t of transactionsThisMonth) {
    if (t.type !== TransactionType.EXPENSE || !t.categoryId) continue;
    spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + Number(t.amount));
  }

  const budget = categories.map((c) => {
    const spent = spentByCategory.get(c.id) ?? 0;
    const limit = Number(c.monthlyLimit);
    const { pct, over } = budgetProgress(spent, limit);
    return { id: c.id, name: c.name, spent, limit, pct, over, currency: c.currency };
  });

  const contributionsThisMonth = contributions.filter((c) => c.date >= monthStart && c.date < monthEnd);
  const contributionsByType = new Map<ContributionType, number>();
  let contributionsTotalBrl = 0;
  for (const c of contributionsThisMonth) {
    if (!c.account || c.account.currency !== Currency.BRL) continue;
    contributionsByType.set(c.type, (contributionsByType.get(c.type) ?? 0) + Number(c.amount));
    contributionsTotalBrl += Number(c.amount);
  }
  const titheGiven = contributionsByType.get(ContributionType.TITHE) ?? 0;
  const { pct: tithePct } = titheGoalProgress(titheGiven, byCurrency.BRL.income);
  const dizimo = {
    total: contributionsTotalBrl,
    pct: tithePct,
    items: (Object.keys(CONTRIBUTION_LABELS) as ContributionType[]).map((type) => ({
      type,
      label: CONTRIBUTION_LABELS[type],
      amount: contributionsByType.get(type) ?? 0,
    })),
  };

  return {
    // Compat: início ainda usa saldo BRL do mês
    balance: byCurrency.BRL.balance,
    income: byCurrency.BRL.income,
    expense: byCurrency.BRL.expense,
    byCurrency,
    accounts: accounts.map((a) => {
      const month = accountMonth.get(a.id) ?? { income: 0, expense: 0 };
      return {
        id: a.id,
        name: a.name,
        currency: a.currency,
        income: month.income,
        expense: month.expense,
        balance: month.income - month.expense,
      };
    }),
    budget,
    dizimo,
    transactions: allTransactions
      .filter((t) => t.account)
      .map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        date: t.date,
        categoryId: t.categoryId,
        categoryName: t.category?.name ?? null,
        incomeCategory: t.incomeCategory,
        accountId: t.accountId,
        accountName: t.account.name,
        currency: t.account.currency,
      })),
    bills: bills
      .filter((b) => b.account)
      .map((b) => ({
        id: b.id,
        name: b.name,
        amount: Number(b.amount),
        dueDate: b.dueDate,
        paid: b.paid,
        accountId: b.accountId,
        accountName: b.account.name,
        currency: b.account.currency,
      })),
    contributions: contributions
      .filter((c) => c.account)
      .map((c) => ({
        id: c.id,
        type: c.type,
        label: CONTRIBUTION_LABELS[c.type],
        amount: Number(c.amount),
        date: c.date,
        accountId: c.accountId,
        accountName: c.account.name,
        currency: c.account.currency,
      })),
    recurringIncomes: recurringIncomes
      .filter((r) => r.account)
      .map((r) => ({
        id: r.id,
        description: r.description,
        amount: Number(r.amount),
        dayOfMonth: r.dayOfMonth,
        category: r.category,
        active: r.active,
        accountId: r.accountId,
        accountName: r.account.name,
        currency: r.account.currency,
      })),
  };
}

export async function createFinancialAccount(familyId: string, input: CreateFinancialAccountInput) {
  await prisma.financialAccount.create({
    data: {
      familyId,
      name: input.name,
      currency: input.currency,
    },
  });
}

export async function updateFinancialAccount(familyId: string, accountId: string, input: Pick<CreateFinancialAccountInput, "name">) {
  const result = await prisma.financialAccount.updateMany({
    where: { id: accountId, familyId },
    data: { name: input.name },
  });
  if (result.count === 0) throw new Error("Conta financeira não encontrada.");
}

export async function deleteFinancialAccount(familyId: string, accountId: string) {
  const [accountCount, account] = await Promise.all([
    prisma.financialAccount.count({ where: { familyId } }),
    prisma.financialAccount.findFirst({ where: { id: accountId, familyId }, select: { id: true } }),
  ]);
  if (!account) throw new Error("Conta financeira não encontrada.");
  if (accountCount <= 1) throw new Error("Mantenha pelo menos uma conta financeira.");

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { familyId, accountId } }),
    prisma.bill.deleteMany({ where: { familyId, accountId } }),
    prisma.contribution.deleteMany({ where: { familyId, accountId } }),
    prisma.recurringIncome.deleteMany({ where: { familyId, accountId } }),
    prisma.financialAccount.deleteMany({ where: { id: accountId, familyId } }),
  ]);
}

export async function createTransaction(familyId: string, userId: string, input: CreateTransactionInput) {
  const account = await assertAccountInFamily(familyId, input.accountId);
  const categoryId = input.type === TransactionType.EXPENSE ? input.categoryId || null : null;
  const category = await assertCategoryInFamily(familyId, categoryId);
  if (category && category.currency !== account.currency) {
    throw new Error("A categoria precisa ser da mesma moeda da conta.");
  }

  await prisma.transaction.create({
    data: {
      familyId,
      accountId: input.accountId,
      description: input.description,
      amount: input.amount,
      type: input.type,
      date: new Date(input.date),
      categoryId,
      incomeCategory: input.type === TransactionType.INCOME ? (input.incomeCategory ?? IncomeCategory.OTHER) : null,
      createdById: userId,
    },
  });
}

export async function updateTransaction(familyId: string, transactionId: string, input: CreateTransactionInput) {
  const account = await assertAccountInFamily(familyId, input.accountId);
  const categoryId = input.type === TransactionType.EXPENSE ? input.categoryId || null : null;
  const category = await assertCategoryInFamily(familyId, categoryId);
  if (category && category.currency !== account.currency) {
    throw new Error("A categoria precisa ser da mesma moeda da conta.");
  }

  const result = await prisma.transaction.updateMany({
    where: { id: transactionId, familyId },
    data: {
      accountId: input.accountId,
      description: input.description,
      amount: input.amount,
      type: input.type,
      date: new Date(input.date),
      categoryId,
      incomeCategory: input.type === TransactionType.INCOME ? (input.incomeCategory ?? IncomeCategory.OTHER) : null,
    },
  });
  if (result.count === 0) throw new Error("Transação não encontrada.");
}

export async function deleteTransaction(familyId: string, transactionId: string) {
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, familyId },
    select: { recurringIncomeId: true, date: true },
  });
  if (!existing) throw new Error("Transação não encontrada.");

  const monthStart = startOfMonth();
  const monthEnd = startOfNextMonth();
  const blocksRegeneration =
    existing.recurringIncomeId != null && existing.date >= monthStart && existing.date < monthEnd;

  await prisma.$transaction([
    ...(blocksRegeneration
      ? [
          prisma.recurringIncome.updateMany({
            where: { id: existing.recurringIncomeId!, familyId },
            data: {
              skippedYear: monthStart.getFullYear(),
              skippedMonth: monthStart.getMonth() + 1,
            },
          }),
        ]
      : []),
    prisma.transaction.deleteMany({ where: { id: transactionId, familyId } }),
  ]);
}

export async function createBill(familyId: string, input: CreateBillInput) {
  await assertAccountInFamily(familyId, input.accountId);
  await prisma.bill.create({
    data: {
      familyId,
      accountId: input.accountId,
      name: input.name,
      amount: input.amount,
      dueDate: new Date(input.dueDate),
    },
  });
}

export async function updateBill(familyId: string, billId: string, input: CreateBillInput) {
  await assertAccountInFamily(familyId, input.accountId);
  const result = await prisma.bill.updateMany({
    where: { id: billId, familyId },
    data: {
      accountId: input.accountId,
      name: input.name,
      amount: input.amount,
      dueDate: new Date(input.dueDate),
    },
  });
  if (result.count === 0) throw new Error("Conta não encontrada.");
}

export async function setBillPaid(familyId: string, billId: string, paid: boolean) {
  const result = await prisma.bill.updateMany({
    where: { id: billId, familyId },
    data: { paid },
  });

  if (result.count === 0) {
    throw new Error("Conta não encontrada.");
  }
}

export async function markBillPaid(familyId: string, billId: string) {
  await setBillPaid(familyId, billId, true);
}

export async function deleteBill(familyId: string, billId: string) {
  const result = await prisma.bill.deleteMany({
    where: { id: billId, familyId },
  });
  if (result.count === 0) throw new Error("Conta não encontrada.");
}

export async function createContribution(familyId: string, userId: string, input: CreateContributionInput) {
  await assertAccountInFamily(familyId, input.accountId);
  await prisma.contribution.create({
    data: {
      familyId,
      accountId: input.accountId,
      type: input.type,
      amount: input.amount,
      date: new Date(input.date),
      createdById: userId,
    },
  });
}

export async function deleteContribution(familyId: string, contributionId: string) {
  const result = await prisma.contribution.deleteMany({
    where: { id: contributionId, familyId },
  });
  if (result.count === 0) throw new Error("Contribuição não encontrada.");
}

export async function createBudgetCategory(familyId: string, input: CreateBudgetCategoryInput) {
  await prisma.budgetCategory.create({
    data: {
      familyId,
      name: input.name,
      monthlyLimit: input.monthlyLimit,
      currency: input.currency,
    },
  });
}

export async function updateBudgetCategory(familyId: string, categoryId: string, input: CreateBudgetCategoryInput) {
  const result = await prisma.budgetCategory.updateMany({
    where: { id: categoryId, familyId },
    data: {
      name: input.name,
      monthlyLimit: input.monthlyLimit,
      currency: input.currency,
    },
  });
  if (result.count === 0) throw new Error("Categoria não encontrada.");
}

export async function deleteBudgetCategory(familyId: string, categoryId: string) {
  const result = await prisma.budgetCategory.deleteMany({
    where: { id: categoryId, familyId },
  });
  if (result.count === 0) throw new Error("Categoria não encontrada.");
}

export async function createRecurringIncome(familyId: string, input: CreateRecurringIncomeInput) {
  await assertAccountInFamily(familyId, input.accountId);
  await prisma.recurringIncome.create({
    data: {
      familyId,
      accountId: input.accountId,
      description: input.description,
      amount: input.amount,
      dayOfMonth: input.dayOfMonth,
      category: input.category,
    },
  });
}

export async function updateRecurringIncome(familyId: string, recurringId: string, input: UpdateRecurringIncomeInput) {
  await assertAccountInFamily(familyId, input.accountId);
  const result = await prisma.recurringIncome.updateMany({
    where: { id: recurringId, familyId },
    data: {
      accountId: input.accountId,
      description: input.description,
      amount: input.amount,
      dayOfMonth: input.dayOfMonth,
      category: input.category,
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
  if (result.count === 0) throw new Error("Receita recorrente não encontrada.");
}

export async function deleteRecurringIncome(familyId: string, recurringId: string) {
  const result = await prisma.recurringIncome.deleteMany({
    where: { id: recurringId, familyId },
  });
  if (result.count === 0) throw new Error("Receita recorrente não encontrada.");
}
