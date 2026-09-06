import { z } from "zod";

export const createShoppingItemSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do item."),
  quantity: z.string().trim().min(1, "Informe a quantidade."),
  category: z.string().trim().min(1, "Informe a categoria."),
  estimatedPrice: z.coerce.number().nonnegative("Informe um valor válido.").optional(),
});

export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>;
