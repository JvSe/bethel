import { z } from "zod";

export const createPrayerRequestSchema = z.object({
  text: z.string().trim().min(1, "Escreva o pedido de oração."),
});

export type CreatePrayerRequestInput = z.infer<typeof createPrayerRequestSchema>;
