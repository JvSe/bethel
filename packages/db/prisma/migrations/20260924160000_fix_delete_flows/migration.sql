-- Apagar conta ou família precisa levar os lançamentos juntos.
-- RESTRICT barrava o DELETE quando ainda existia transação, conta, contribuição ou receita.

ALTER TABLE "transaction" DROP CONSTRAINT "transaction_accountId_fkey";
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recurring_income" DROP CONSTRAINT "recurring_income_accountId_fkey";
ALTER TABLE "recurring_income" ADD CONSTRAINT "recurring_income_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contribution" DROP CONSTRAINT "contribution_accountId_fkey";
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bill" DROP CONSTRAINT "bill_accountId_fkey";
ALTER TABLE "bill" ADD CONSTRAINT "bill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mês em que o usuário apagou o lançamento gerado, para não recriar no mesmo mês.
ALTER TABLE "recurring_income" ADD COLUMN "skippedYear" INTEGER;
ALTER TABLE "recurring_income" ADD COLUMN "skippedMonth" INTEGER;

-- Item da despensa apagado também sai da lista de compras que nasceu dele.
ALTER TABLE "shopping_item" DROP CONSTRAINT "shopping_item_sourcePantryItemId_fkey";
ALTER TABLE "shopping_item" ADD CONSTRAINT "shopping_item_sourcePantryItemId_fkey" FOREIGN KEY ("sourcePantryItemId") REFERENCES "pantry_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
