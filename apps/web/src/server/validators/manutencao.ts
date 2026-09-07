import { z } from "zod";
import { isoDateSchema, shortTextSchema } from "./common";

export const createMaintenanceItemSchema = z.object({
  title: shortTextSchema("Informe o título."),
  type: shortTextSchema("Informe o tipo."),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"]),
  nextDueAt: isoDateSchema,
});

export type CreateMaintenanceItemInput = z.infer<typeof createMaintenanceItemSchema>;
