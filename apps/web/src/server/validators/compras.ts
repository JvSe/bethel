import { z } from "zod";
import { shortTextSchema } from "./common";

export const createShoppingItemSchema = z.object({
  name: shortTextSchema("Informe o nome do item."),
  quantity: shortTextSchema("Informe a quantidade."),
  category: shortTextSchema("Informe a categoria."),
  estimatedPrice: z.coerce.number().nonnegative("Informe um valor válido.").max(99_999_999.99).optional(),
});

export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>;
