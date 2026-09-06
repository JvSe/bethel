"use server";

import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import {
  createBill,
  createBudgetCategory,
  createContribution,
  createTransaction,
  deleteBill,
  deleteBudgetCategory,
  deleteContribution,
  deleteTransaction,
  setBillPaid,
  updateBill,
  updateBudgetCategory,
  updateTransaction,
} from "@/server/data/financas";
import {
  createBillSchema,
  createBudgetCategorySchema,
  createContributionSchema,
  createTransactionSchema,
} from "@/server/validators/financas";

type ActionResult = { success: true } | { success: false; error: string };

function revalidateFinancas() {
  revalidatePath("/financas");
  revalidatePath("/inicio");
}

export async function createTransactionAction(input: unknown): Promise<ActionResult> {
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId, userId } = await requireFamilySession();
  await createTransaction(familyId, userId, parsed.data);
  revalidateFinancas();
  return { success: true };
}

export async function updateTransactionAction(transactionId: string, input: unknown): Promise<ActionResult> {
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  try {
    await updateTransaction(familyId, transactionId, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar transação." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function deleteTransactionAction(transactionId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deleteTransaction(familyId, transactionId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar transação." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function createBillAction(input: unknown): Promise<ActionResult> {
  const parsed = createBillSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  await createBill(familyId, parsed.data);
  revalidateFinancas();
  return { success: true };
}

export async function updateBillAction(billId: string, input: unknown): Promise<ActionResult> {
  const parsed = createBillSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  try {
    await updateBill(familyId, billId, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar conta." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function markBillPaidAction(billId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();

  try {
    await setBillPaid(familyId, billId, true);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar conta." };
  }

  revalidateFinancas();
  return { success: true };
}

export async function unmarkBillPaidAction(billId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();

  try {
    await setBillPaid(familyId, billId, false);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar conta." };
  }

  revalidateFinancas();
  return { success: true };
}

export async function deleteBillAction(billId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deleteBill(familyId, billId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar conta." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function createContributionAction(input: unknown): Promise<ActionResult> {
  const parsed = createContributionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId, userId } = await requireFamilySession();
  await createContribution(familyId, userId, parsed.data);
  revalidateFinancas();
  return { success: true };
}

export async function deleteContributionAction(contributionId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deleteContribution(familyId, contributionId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar contribuição." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function createBudgetCategoryAction(input: unknown): Promise<ActionResult> {
  const parsed = createBudgetCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  await createBudgetCategory(familyId, parsed.data);
  revalidateFinancas();
  return { success: true };
}

export async function updateBudgetCategoryAction(categoryId: string, input: unknown): Promise<ActionResult> {
  const parsed = createBudgetCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { familyId } = await requireFamilySession();
  try {
    await updateBudgetCategory(familyId, categoryId, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar categoria." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function deleteBudgetCategoryAction(categoryId: string): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();
  try {
    await deleteBudgetCategory(familyId, categoryId);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar categoria." };
  }
  revalidateFinancas();
  return { success: true };
}
