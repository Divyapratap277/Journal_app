import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { asyncHandler } from "./auth";
import { accountFilter, closedTradeFilter, parseQueryString } from "../accountFilter";

export const statsRouter = Router();

type DirectionStats = {
  net: number;
  wins: number;
  winAmount: number;
  losses: number;
  lossAmount: number;
  winRate: number;
  total: number;
};

function emptyDirection(): DirectionStats {
  return { net: 0, wins: 0, winAmount: 0, losses: 0, lossAmount: 0, winRate: 0, total: 0 };
}

function accumulate(list: { profitLoss: { toString(): string } | null }[]): DirectionStats {
  const stats = emptyDirection();
  for (const t of list) {
    if (t.profitLoss === null) continue;
    const pl = Number(t.profitLoss.toString());
    stats.total += 1;
    stats.net += pl;
    if (pl > 0) {
      stats.wins += 1;
      stats.winAmount += pl;
    } else if (pl < 0) {
      stats.losses += 1;
      stats.lossAmount += pl;
    }
  }
  stats.winRate = stats.total === 0 ? 0 : (stats.wins / stats.total) * 100;
  return stats;
}

function rangeWhere(from?: string, to?: string): Prisma.TradeWhereInput {
  if (!from && !to) return {};
  const openedAt: Prisma.DateTimeFilter = {};
  if (from) openedAt.gte = new Date(from);
  if (to) {
    const end = new Date(to);
    if (/^\d{4}-\d{2}-\d{2}$/.test(to)) end.setUTCHours(23, 59, 59, 999);
    openedAt.lte = end;
  }
  return { openedAt };
}

statsRouter.get("/stats", asyncHandler(async (req, res) => {
  const where: Prisma.TradeWhereInput = {
    AND: [
      accountFilter(req.query.accountId),
      closedTradeFilter(),
      rangeWhere(parseQueryString(req.query.from), parseQueryString(req.query.to)),
    ],
  };

  const closed = await prisma.trade.findMany({
    where,
    select: { profitLoss: true, direction: true },
  });

  const all = accumulate(closed);
  const longs = accumulate(closed.filter((t) => t.direction === "BUY"));
  const shorts = accumulate(closed.filter((t) => t.direction === "SELL"));

  const averageProfit = all.wins === 0 ? 0 : all.winAmount / all.wins;
  const averageLoss = all.losses === 0 ? 0 : all.lossAmount / all.losses;
  const lossRate = all.total === 0 ? 0 : (all.losses / all.total) * 100;

  res.json({
    totalTrades: all.total,
    winningTrades: all.wins,
    losingTrades: all.losses,
    breakevenTrades: all.total - all.wins - all.losses,
    winRate: all.winRate,
    lossRate,
    totalProfitLoss: all.net,
    averageProfit,
    averageLoss,
    long: longs,
    short: shorts,
    profitability: {
      totalTrades: all.total,
      winRate: all.winRate,
      lossRate,
      wins: all.wins,
      losses: all.losses,
    },
  });
}));
