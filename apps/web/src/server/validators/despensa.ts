import { z } from "zod";
import { shortTextSchema } from "./common";

export const createPantryItemSchema = z.object({
  name: shortTextSchema("Informe o nome do item."),
  quantity: shortTextSchema("Informe a quantidade."),
  category: shortTextSchema("Informe a categoria."),
  level: z.enum(["OK", "LOW", "OUT"]),
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemSchema>;

export const updatePantryItemSchema = z.object({
  quantity: shortTextSchema("Informe a quantidade."),
  level: z.enum(["OK", "LOW", "OUT"]),
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemSchema>;
