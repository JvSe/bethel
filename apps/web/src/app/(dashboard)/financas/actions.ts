"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyAction } from "@/server/auth";
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
import { entityIdSchema } from "@/server/validators/common";
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

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;

  try {
    await createTransaction(authz.session.familyId, authz.session.userId, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao criar transação." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function updateTransactionAction(transactionId: string, input: unknown): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(transactionId);
  const parsed = createTransactionSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await updateTransaction(authz.session.familyId, id.data, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar transação." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function deleteTransactionAction(transactionId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(transactionId);
  if (!id.success) return { success: false, error: "Transação inválida." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deleteTransaction(authz.session.familyId, id.data);
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

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await createBill(authz.session.familyId, parsed.data);
  revalidateFinancas();
  return { success: true };
}

export async function updateBillAction(billId: string, input: unknown): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(billId);
  const parsed = createBillSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await updateBill(authz.session.familyId, id.data, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar conta." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function markBillPaidAction(billId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(billId);
  if (!id.success) return { success: false, error: "Conta inválida." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;

  try {
    await setBillPaid(authz.session.familyId, id.data, true);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar conta." };
  }

  revalidateFinancas();
  return { success: true };
}

export async function unmarkBillPaidAction(billId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(billId);
  if (!id.success) return { success: false, error: "Conta inválida." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;

  try {
    await setBillPaid(authz.session.familyId, id.data, false);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar conta." };
  }

  revalidateFinancas();
  return { success: true };
}

export async function deleteBillAction(billId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(billId);
  if (!id.success) return { success: false, error: "Conta inválida." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deleteBill(authz.session.familyId, id.data);
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

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await createContribution(authz.session.familyId, authz.session.userId, parsed.data);
  revalidateFinancas();
  return { success: true };
}

export async function deleteContributionAction(contributionId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(contributionId);
  if (!id.success) return { success: false, error: "Contribuição inválida." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deleteContribution(authz.session.familyId, id.data);
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

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  await createBudgetCategory(authz.session.familyId, parsed.data);
  revalidateFinancas();
  return { success: true };
}

export async function updateBudgetCategoryAction(categoryId: string, input: unknown): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(categoryId);
  const parsed = createBudgetCategorySchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? "Dados inválidos." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await updateBudgetCategory(authz.session.familyId, id.data, parsed.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar categoria." };
  }
  revalidateFinancas();
  return { success: true };
}

export async function deleteBudgetCategoryAction(categoryId: string): Promise<ActionResult> {
  const id = entityIdSchema.safeParse(categoryId);
  if (!id.success) return { success: false, error: "Categoria inválida." };

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  try {
    await deleteBudgetCategory(authz.session.familyId, id.data);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao apagar categoria." };
  }
  revalidateFinancas();
  return { success: true };
}
