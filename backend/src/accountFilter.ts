import type { Prisma } from "@prisma/client";

export function parseQueryString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const last = value[value.length - 1];
    return typeof last === "string" ? last : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

export function accountFilter(accountId: unknown): Prisma.TradeWhereInput {
  const id = parseQueryString(accountId);
  if (!id || id === "all") {
    return {};
  }
  return { accountId: id };
}

export function closedTradeFilter(): Prisma.TradeWhereInput {
  return { profitLoss: { not: null } };
}
