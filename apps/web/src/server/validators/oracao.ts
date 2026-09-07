import { z } from "zod";
import { longTextSchema } from "./common";

export const createPrayerRequestSchema = z.object({
  text: longTextSchema("Escreva o pedido de oração."),
});

export type CreatePrayerRequestInput = z.infer<typeof createPrayerRequestSchema>;

export const prayerStatusSchema = z.enum(["PRAYING", "ANSWERED"]);
