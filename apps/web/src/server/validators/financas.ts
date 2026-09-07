import { z } from "zod";
import { isoDateSchema, moneySchema, shortTextSchema } from "./common";

export const createTransactionSchema = z.object({
  description: shortTextSchema("Informe a descrição."),
  amount: moneySchema,
  type: z.enum(["INCOME", "EXPENSE"]),
  date: isoDateSchema,
  categoryId: z.string().trim().max(64).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const createBillSchema = z.object({
  name: shortTextSchema("Informe o nome da conta."),
  amount: moneySchema,
  dueDate: isoDateSchema,
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

export const createContributionSchema = z.object({
  type: z.enum(["TITHE", "OFFERING", "MISSIONS"]),
  amount: moneySchema,
  date: isoDateSchema,
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;

export const createBudgetCategorySchema = z.object({
  name: shortTextSchema("Informe o nome da categoria."),
  monthlyLimit: moneySchema,
});

export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategorySchema>;

export const updateTransactionSchema = createTransactionSchema;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const updateBillSchema = createBillSchema;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;

export const updateBudgetCategorySchema = createBudgetCategorySchema;
export type UpdateBudgetCategoryInput = z.infer<typeof updateBudgetCategorySchema>;
