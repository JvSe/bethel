import { z } from "zod";

export const entityIdSchema = z.string().trim().min(1, "Identificador inválido.").max(64);
export const shortTextSchema = (message: string) => z.string().trim().min(1, message).max(200);
export const longTextSchema = (message: string) => z.string().trim().min(1, message).max(2000);
export const moneySchema = z.coerce
  .number({ error: "Informe um valor." })
  .positive("Informe um valor maior que zero.")
  .max(99_999_999.99, "Informe um valor válido.");
export const isoDateSchema = z.string().trim().min(1, "Informe a data.").max(40);
export const emailSchema = z.string().trim().email("Informe um e-mail válido.").max(254);
