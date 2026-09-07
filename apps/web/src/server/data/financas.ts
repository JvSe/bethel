import prisma, { ContributionType, TransactionType } from "@bethel/db";
import { budgetProgress, titheGoalProgress } from "@/lib/calc";
import type {
  CreateBillInput,
  CreateBudgetCategoryInput,
  CreateContributionInput,
  CreateTransactionInput,
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

export async function getFinanceOverview(familyId: string) {
  const monthStart = startOfMonth();
  const monthEnd = startOfNextMonth();

  const [categories, transactionsThisMonth, recentTransactions, contributionsThisMonth, bills] = await Promise.all([
    prisma.budgetCategory.findMany({ where: { familyId }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({ where: { familyId, date: { gte: monthStart, lt: monthEnd } } }),
    prisma.transaction.findMany({
      where: { familyId },
      include: { category: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 8,
    }),
    prisma.contribution.findMany({ where: { familyId, date: { gte: monthStart, lt: monthEnd } } }),
    prisma.bill.findMany({ where: { familyId }, orderBy: { dueDate: "asc" } }),
  ]);

  const income = transactionsThisMonth
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactionsThisMonth
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const spentByCategory = new Map<string, number>();
  for (const t of transactionsThisMonth) {
    if (t.type !== TransactionType.EXPENSE || !t.categoryId) continue;
    spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + Number(t.amount));
  }

  const budget = categories.map((c) => {
    const spent = spentByCategory.get(c.id) ?? 0;
    const limit = Number(c.monthlyLimit);
    const { pct, over } = budgetProgress(spent, limit);
    return { id: c.id, name: c.name, spent, limit, pct, over };
  });

  const contributionsByType = new Map<ContributionType, number>();
  for (const c of contributionsThisMonth) {
    contributionsByType.set(c.type, (contributionsByType.get(c.type) ?? 0) + Number(c.amount));
  }
  const titheGiven = contributionsByType.get(ContributionType.TITHE) ?? 0;
  const { pct: tithePct } = titheGoalProgress(titheGiven, income);
  const contributionsTotal = contributionsThisMonth.reduce((sum, c) => sum + Number(c.amount), 0);

  const dizimo = {
    total: contributionsTotal,
    pct: tithePct,
    items: (Object.keys(CONTRIBUTION_LABELS) as ContributionType[]).map((type) => ({
      type,
      label: CONTRIBUTION_LABELS[type],
      amount: contributionsByType.get(type) ?? 0,
    })),
  };

  return {
    balance: income - expense,
    income,
    expense,
    budget,
    dizimo,
    transactions: recentTransactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      date: t.date,
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? null,
    })),
    bills: bills.map((b) => ({
      id: b.id,
      name: b.name,
      amount: Number(b.amount),
      dueDate: b.dueDate,
      paid: b.paid,
    })),
    contributions: [...contributionsThisMonth]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((c) => ({
        id: c.id,
        type: c.type,
        label: CONTRIBUTION_LABELS[c.type],
        amount: Number(c.amount),
        date: c.date,
      })),
  };
}

async function assertCategoryInFamily(familyId: string, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const category = await prisma.budgetCategory.findFirst({
    where: { id: categoryId, familyId },
    select: { id: true },
  });
  if (!category) throw new Error("Categoria inválida.");
}

export async function createTransaction(familyId: string, userId: string, input: CreateTransactionInput) {
  const categoryId = input.categoryId || null;
  await assertCategoryInFamily(familyId, categoryId);
  await prisma.transaction.create({
    data: {
      familyId,
      description: input.description,
      amount: input.amount,
      type: input.type,
      date: new Date(input.date),
      categoryId,
      createdById: userId,
    },
  });
}

export async function createBill(familyId: string, input: CreateBillInput) {
  await prisma.bill.create({
    data: {
      familyId,
      name: input.name,
      amount: input.amount,
      dueDate: new Date(input.dueDate),
    },
  });
}

export async function updateTransaction(familyId: string, transactionId: string, input: CreateTransactionInput) {
  const categoryId = input.categoryId || null;
  await assertCategoryInFamily(familyId, categoryId);
  const result = await prisma.transaction.updateMany({
    where: { id: transactionId, familyId },
    data: {
      description: input.description,
      amount: input.amount,
      type: input.type,
      date: new Date(input.date),
      categoryId,
    },
  });
  if (result.count === 0) throw new Error("Transação não encontrada.");
}

export async function updateBill(familyId: string, billId: string, input: CreateBillInput) {
  const result = await prisma.bill.updateMany({
    where: { id: billId, familyId },
    data: {
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

export async function deleteTransaction(familyId: string, transactionId: string) {
  const result = await prisma.transaction.deleteMany({
    where: { id: transactionId, familyId },
  });
  if (result.count === 0) throw new Error("Transação não encontrada.");
}

export async function deleteBill(familyId: string, billId: string) {
  const result = await prisma.bill.deleteMany({
    where: { id: billId, familyId },
  });
  if (result.count === 0) throw new Error("Conta não encontrada.");
}

export async function createContribution(familyId: string, userId: string, input: CreateContributionInput) {
  await prisma.contribution.create({
    data: {
      familyId,
      type: input.type,
      amount: input.amount,
      date: new Date(input.date),
      createdById: userId,
    },
  });
}

export async function createBudgetCategory(familyId: string, input: CreateBudgetCategoryInput) {
  await prisma.budgetCategory.create({
    data: {
      familyId,
      name: input.name,
      monthlyLimit: input.monthlyLimit,
    },
  });
}

export async function deleteContribution(familyId: string, contributionId: string) {
  const result = await prisma.contribution.deleteMany({
    where: { id: contributionId, familyId },
  });
  if (result.count === 0) throw new Error("Contribuição não encontrada.");
}

export async function updateBudgetCategory(familyId: string, categoryId: string, input: CreateBudgetCategoryInput) {
  const result = await prisma.budgetCategory.updateMany({
    where: { id: categoryId, familyId },
    data: {
      name: input.name,
      monthlyLimit: input.monthlyLimit,
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
