import { z } from "zod";

export const createGratitudeEntrySchema = z.object({
  text: z.string().trim().min(1, "Escreva sua gratidão."),
});

export type CreateGratitudeEntryInput = z.infer<typeof createGratitudeEntrySchema>;
