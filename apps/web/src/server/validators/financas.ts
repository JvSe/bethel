import { z } from "zod";

export const createTransactionSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição."),
  amount: z.coerce.number({ error: "Informe um valor." }).positive("Informe um valor maior que zero."),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().min(1, "Informe a data."),
  categoryId: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const createBillSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da conta."),
  amount: z.coerce.number({ error: "Informe um valor." }).positive("Informe um valor maior que zero."),
  dueDate: z.string().min(1, "Informe o vencimento."),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

export const createContributionSchema = z.object({
  type: z.enum(["TITHE", "OFFERING", "MISSIONS"]),
  amount: z.coerce.number({ error: "Informe um valor." }).positive("Informe um valor maior que zero."),
  date: z.string().min(1, "Informe a data."),
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;

export const createBudgetCategorySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria."),
  monthlyLimit: z.coerce.number({ error: "Informe um valor." }).positive("Informe um valor maior que zero."),
});

export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategorySchema>;

export const updateTransactionSchema = createTransactionSchema;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const updateBillSchema = createBillSchema;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;

export const updateBudgetCategorySchema = createBudgetCategorySchema;
export type UpdateBudgetCategoryInput = z.infer<typeof updateBudgetCategorySchema>;
