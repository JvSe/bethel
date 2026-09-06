import { z } from "zod";

export const createCalendarEventSchema = z.object({
  title: z.string().trim().min(1, "Informe o título."),
  category: z.string().trim().min(1, "Informe a categoria."),
  date: z.string().min(1, "Informe a data."),
  startTime: z.string().min(1, "Informe o horário."),
  endTime: z.string().optional(),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export const updateCalendarEventSchema = createCalendarEventSchema;

export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
