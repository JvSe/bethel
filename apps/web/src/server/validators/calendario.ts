import { z } from "zod";
import { isoDateSchema, shortTextSchema } from "./common";

export const createCalendarEventSchema = z.object({
  title: shortTextSchema("Informe o título."),
  category: shortTextSchema("Informe a categoria."),
  date: isoDateSchema,
  startTime: z.string().trim().min(1, "Informe o horário.").max(16),
  endTime: z.string().trim().max(16).optional(),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export const updateCalendarEventSchema = createCalendarEventSchema;

export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
