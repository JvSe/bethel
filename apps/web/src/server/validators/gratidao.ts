import { z } from "zod";
import { longTextSchema } from "./common";

export const createGratitudeEntrySchema = z.object({
  text: longTextSchema("Escreva sua gratidão."),
});

export type CreateGratitudeEntryInput = z.infer<typeof createGratitudeEntrySchema>;
