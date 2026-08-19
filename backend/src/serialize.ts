import type { Prisma, Trade, TradeImage } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

function dec(value: Decimal | null | undefined) {
  return value === null || value === undefined ? null : value.toString();
}

export type SerializedImage = {
  id: string;
  tradeId: string;
  fileName: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type SerializedTrade = {
  id: string;
  accountId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  quantity: string;
  entryPrice: string;
  exitPrice: string | null;
  stopLoss: string | null;
  openedAt: string;
  profitLoss: string | null;
  currency: string;
  strategy: string | null;
  entryReason: string | null;
  followedPlan: boolean | null;
  emotionalState: string | null;
  mistake: string | null;
  lesson: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  result: "Win" | "Loss" | "BE" | "Open";
  images?: SerializedImage[];
};

export function deriveResult(profitLoss: Decimal | null): SerializedTrade["result"] {
  if (profitLoss === null) return "Open";
  const n = Number(profitLoss.toString());
  if (n > 0) return "Win";
  if (n < 0) return "Loss";
  return "BE";
}

export function serializeImage(image: TradeImage): SerializedImage {
  return {
    id: image.id,
    tradeId: image.tradeId,
    fileName: image.fileName,
    cloudinaryPublicId: image.cloudinaryPublicId,
    secureUrl: image.secureUrl,
    mimeType: image.mimeType,
    sizeBytes: image.sizeBytes,
    createdAt: image.createdAt.toISOString(),
  };
}

export function serializeTrade(
  trade: Trade & { images?: TradeImage[] }
): SerializedTrade {
  return {
    id: trade.id,
    accountId: trade.accountId,
    symbol: trade.symbol,
    direction: trade.direction,
    quantity: trade.quantity.toString(),
    entryPrice: trade.entryPrice.toString(),
    exitPrice: dec(trade.exitPrice),
    stopLoss: dec(trade.stopLoss),
    openedAt: trade.openedAt.toISOString(),
    profitLoss: dec(trade.profitLoss),
    currency: trade.currency,
    strategy: trade.strategy,
    entryReason: trade.entryReason,
    followedPlan: trade.followedPlan,
    emotionalState: trade.emotionalState,
    mistake: trade.mistake,
    lesson: trade.lesson,
    notes: trade.notes,
    createdAt: trade.createdAt.toISOString(),
    updatedAt: trade.updatedAt.toISOString(),
    result: deriveResult(trade.profitLoss),
    images: trade.images?.map(serializeImage),
  };
}

export function toPrismaData(body: {
  accountId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  quantity: string;
  entryPrice: string;
  exitPrice?: string;
  stopLoss?: string;
  openedAt: string;
  profitLoss?: string;
  currency?: string;
  strategy?: string;
  entryReason?: string;
  followedPlan?: boolean;
  emotionalState?: string;
  mistake?: string;
  lesson?: string;
  notes?: string;
}): Prisma.TradeUncheckedCreateInput {
  return {
    accountId: body.accountId,
    symbol: body.symbol.toUpperCase(),
    direction: body.direction,
    quantity: body.quantity,
    entryPrice: body.entryPrice,
    exitPrice: body.exitPrice ?? null,
    stopLoss: body.stopLoss ?? null,
    openedAt: new Date(body.openedAt),
    profitLoss: body.profitLoss ?? null,
    currency: body.currency ?? "USD",
    strategy: body.strategy ?? null,
    entryReason: body.entryReason ?? null,
    followedPlan: body.followedPlan ?? null,
    emotionalState: body.emotionalState ?? null,
    mistake: body.mistake ?? null,
    lesson: body.lesson ?? null,
    notes: body.notes ?? null,
  };
}
