-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BRL', 'USD');

-- CreateEnum
CREATE TYPE "IncomeCategory" AS ENUM ('SALARY', 'FREELANCE', 'RENT', 'OTHER');

-- CreateTable
CREATE TABLE "financial_account" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BRL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_income" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "category" "IncomeCategory" NOT NULL DEFAULT 'SALARY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_income_pkey" PRIMARY KEY ("id")
);

-- AlterTable budget_category
ALTER TABLE "budget_category" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'BRL';

-- AlterTable transaction (nullable first for backfill)
ALTER TABLE "transaction" ADD COLUMN "accountId" TEXT;
ALTER TABLE "transaction" ADD COLUMN "incomeCategory" "IncomeCategory";
ALTER TABLE "transaction" ADD COLUMN "recurringIncomeId" TEXT;

-- AlterTable contribution
ALTER TABLE "contribution" ADD COLUMN "accountId" TEXT;

-- AlterTable bill
ALTER TABLE "bill" ADD COLUMN "accountId" TEXT;

-- Default BRL account per existing family
INSERT INTO "financial_account" ("id", "familyId", "name", "currency", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, o."id", 'Conta principal (R$)', 'BRL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "financial_account" fa WHERE fa."familyId" = o."id"
);

-- Backfill accountId from each family's default BRL account
UPDATE "transaction" t
SET "accountId" = fa."id",
    "incomeCategory" = CASE WHEN t."type" = 'INCOME' THEN 'OTHER'::"IncomeCategory" ELSE NULL END
FROM "financial_account" fa
WHERE fa."familyId" = t."familyId"
  AND fa."currency" = 'BRL'
  AND t."accountId" IS NULL;

UPDATE "contribution" c
SET "accountId" = fa."id"
FROM "financial_account" fa
WHERE fa."familyId" = c."familyId"
  AND fa."currency" = 'BRL'
  AND c."accountId" IS NULL;

UPDATE "bill" b
SET "accountId" = fa."id"
FROM "financial_account" fa
WHERE fa."familyId" = b."familyId"
  AND fa."currency" = 'BRL'
  AND b."accountId" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "transaction" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "contribution" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "bill" ALTER COLUMN "accountId" SET NOT NULL;

-- Indexes
CREATE INDEX "financial_account_familyId_idx" ON "financial_account"("familyId");
CREATE INDEX "recurring_income_familyId_idx" ON "recurring_income"("familyId");
CREATE INDEX "recurring_income_accountId_idx" ON "recurring_income"("accountId");
CREATE INDEX "transaction_accountId_idx" ON "transaction"("accountId");
CREATE INDEX "transaction_recurringIncomeId_idx" ON "transaction"("recurringIncomeId");
CREATE INDEX "contribution_accountId_idx" ON "contribution"("accountId");
CREATE INDEX "bill_accountId_idx" ON "bill"("accountId");

-- ForeignKeys
ALTER TABLE "financial_account" ADD CONSTRAINT "financial_account_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recurring_income" ADD CONSTRAINT "recurring_income_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_income" ADD CONSTRAINT "recurring_income_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transaction" ADD CONSTRAINT "transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_recurringIncomeId_fkey" FOREIGN KEY ("recurringIncomeId") REFERENCES "recurring_income"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contribution" ADD CONSTRAINT "contribution_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bill" ADD CONSTRAINT "bill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
