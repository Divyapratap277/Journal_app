-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "broker" TEXT,
    "startingBalance" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- Seed default account so existing trades are not orphaned
INSERT INTO "Account" ("id", "name", "broker", "startingBalance", "currency", "createdAt")
VALUES ('cm_main_account_default', 'Main Account', NULL, 0, 'USD', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN "accountId" TEXT;

UPDATE "Trade" SET "accountId" = 'cm_main_account_default' WHERE "accountId" IS NULL;

ALTER TABLE "Trade" ALTER COLUMN "accountId" SET NOT NULL;

ALTER TABLE "Trade" DROP COLUMN IF EXISTS "market";
ALTER TABLE "Trade" DROP COLUMN IF EXISTS "closedAt";
ALTER TABLE "Trade" DROP COLUMN IF EXISTS "fees";
ALTER TABLE "Trade" DROP COLUMN IF EXISTS "marketCondition";

CREATE INDEX "Trade_accountId_idx" ON "Trade"("accountId");

ALTER TABLE "Trade" ADD CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
