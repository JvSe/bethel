import { z } from "zod";

export const createPantryItemSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do item."),
  quantity: z.string().trim().min(1, "Informe a quantidade."),
  category: z.string().trim().min(1, "Informe a categoria."),
  level: z.enum(["OK", "LOW", "OUT"]),
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemSchema>;

export const updatePantryItemSchema = z.object({
  quantity: z.string().trim().min(1, "Informe a quantidade."),
  level: z.enum(["OK", "LOW", "OUT"]),
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemSchema>;
