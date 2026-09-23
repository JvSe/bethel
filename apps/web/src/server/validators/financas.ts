import { z } from "zod";
import { entityIdSchema, isoDateSchema, moneySchema, shortTextSchema } from "./common";

export const currencySchema = z.enum(["BRL", "USD"]);
export const incomeCategorySchema = z.enum(["SALARY", "FREELANCE", "RENT", "OTHER"]);

export const createFinancialAccountSchema = z.object({
  name: shortTextSchema("Informe o nome da conta."),
  currency: currencySchema,
});

export type CreateFinancialAccountInput = z.infer<typeof createFinancialAccountSchema>;

export const createTransactionSchema = z
  .object({
    description: shortTextSchema("Informe a descrição."),
    amount: moneySchema,
    type: z.enum(["INCOME", "EXPENSE"]),
    date: isoDateSchema,
    accountId: entityIdSchema,
    categoryId: z.string().trim().max(64).optional(),
    incomeCategory: incomeCategorySchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "INCOME" && !data.incomeCategory) {
      ctx.addIssue({
        code: "custom",
        path: ["incomeCategory"],
        message: "Informe a categoria da receita.",
      });
    }
  });

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const createBillSchema = z.object({
  name: shortTextSchema("Informe o nome da conta."),
  amount: moneySchema,
  dueDate: isoDateSchema,
  accountId: entityIdSchema,
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

export const createContributionSchema = z.object({
  type: z.enum(["TITHE", "OFFERING", "MISSIONS"]),
  amount: moneySchema,
  date: isoDateSchema,
  accountId: entityIdSchema,
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;

export const createBudgetCategorySchema = z.object({
  name: shortTextSchema("Informe o nome da categoria."),
  monthlyLimit: moneySchema,
  currency: currencySchema.default("BRL"),
});

export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategorySchema>;

export const createRecurringIncomeSchema = z.object({
  description: shortTextSchema("Informe a descrição."),
  amount: moneySchema,
  accountId: entityIdSchema,
  dayOfMonth: z.coerce
    .number({ error: "Informe o dia do mês." })
    .int("Informe um dia válido.")
    .min(1, "O dia deve ser entre 1 e 28.")
    .max(28, "Use um dia até 28 para funcionar em todos os meses."),
  category: incomeCategorySchema.default("SALARY"),
});

export type CreateRecurringIncomeInput = z.infer<typeof createRecurringIncomeSchema>;

export const updateTransactionSchema = createTransactionSchema;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const updateBillSchema = createBillSchema;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;

export const updateBudgetCategorySchema = createBudgetCategorySchema;
export type UpdateBudgetCategoryInput = z.infer<typeof updateBudgetCategorySchema>;

export const updateFinancialAccountSchema = createFinancialAccountSchema;
export type UpdateFinancialAccountInput = z.infer<typeof updateFinancialAccountSchema>;

export const updateRecurringIncomeSchema = createRecurringIncomeSchema.extend({
  active: z.boolean().optional(),
});
export type UpdateRecurringIncomeInput = z.infer<typeof updateRecurringIncomeSchema>;
