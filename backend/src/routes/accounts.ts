import { Router } from "express";
import { prisma } from "../prisma";
import { accountBodySchema, accountPatchSchema } from "../schemas";
import { asyncHandler } from "./auth";

export const accountsRouter = Router();

async function serializeAccounts() {
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      trades: { select: { profitLoss: true } },
    },
  });

  return accounts.map((account) => {
    const pnl = account.trades.reduce((sum, t) => {
      if (t.profitLoss === null) return sum;
      return sum + Number(t.profitLoss.toString());
    }, 0);
    const starting = Number(account.startingBalance.toString());
    const currentBalance = starting + pnl;
    const profitPercent = starting === 0 ? (pnl === 0 ? 0 : null) : (pnl / starting) * 100;
    return {
      id: account.id,
      name: account.name,
      broker: account.broker,
      startingBalance: account.startingBalance.toString(),
      currency: account.currency,
      createdAt: account.createdAt.toISOString(),
      archived: account.archived,
      currentBalance,
      pnl,
      profitPercent,
      tradeCount: account.trades.length,
    };
  });
}

accountsRouter.get("/accounts", asyncHandler(async (_req, res) => {
  res.json(await serializeAccounts());
}));

accountsRouter.post("/accounts", asyncHandler(async (req, res) => {
  const parsed = accountBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid account" });
    return;
  }
  await prisma.account.create({
    data: {
      name: parsed.data.name,
      broker: parsed.data.broker ?? null,
      startingBalance: String(parsed.data.startingBalance),
      currency: parsed.data.currency ?? "USD",
    },
  });
  res.status(201).json(await serializeAccounts());
}));

accountsRouter.put("/accounts/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.account.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const parsed = accountPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid account" });
    return;
  }
  await prisma.account.update({
    where: { id: req.params.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.broker !== undefined ? { broker: parsed.data.broker ?? null } : {}),
      ...(parsed.data.startingBalance !== undefined ? { startingBalance: String(parsed.data.startingBalance) } : {}),
      ...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {}),
      ...(parsed.data.archived !== undefined ? { archived: parsed.data.archived } : {}),
    },
  });
  res.json(await serializeAccounts());
}));

accountsRouter.delete("/accounts/:id", asyncHandler(async (req, res) => {
  const count = await prisma.account.count();
  if (count <= 1) {
    res.status(400).json({ error: "Keep at least one account" });
    return;
  }
  const trades = await prisma.trade.count({ where: { accountId: req.params.id } });
  if (trades > 0) {
    res.status(400).json({
      error: `This account has ${trades} trades. Archive it instead, or reassign/delete its trades first.`,
      tradeCount: trades,
    });
    return;
  }
  await prisma.account.delete({ where: { id: req.params.id } });
  res.json(await serializeAccounts());
}));
