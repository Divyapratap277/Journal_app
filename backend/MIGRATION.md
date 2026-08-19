-- Accounts + accountId on trades; drop market, closedAt, fees, marketCondition
-- Existing trades are assigned to "Main Account" (id: cm_main_account_default)

-- Apply against Neon:
--   cd backend
--   npx prisma migrate deploy
