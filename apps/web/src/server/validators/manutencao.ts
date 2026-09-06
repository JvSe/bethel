import { z } from "zod";

export const createMaintenanceItemSchema = z.object({
  title: z.string().trim().min(1, "Informe o título."),
  type: z.string().trim().min(1, "Informe o tipo."),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"]),
  nextDueAt: z.string().min(1, "Informe a próxima data."),
});

export type CreateMaintenanceItemInput = z.infer<typeof createMaintenanceItemSchema>;
