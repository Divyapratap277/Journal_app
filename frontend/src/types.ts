export type Direction = "BUY" | "SELL";
export type TradeResult = "Win" | "Loss" | "BE" | "Open";

export type TradeImage = {
  id: string;
  tradeId: string;
  fileName: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type Trade = {
  id: string;
  accountId: string;
  symbol: string;
  direction: Direction;
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
  result: TradeResult;
  images?: TradeImage[];
};

export type TradePayload = {
  accountId: string;
  symbol: string;
  direction: Direction;
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
};

export type DirectionStats = {
  net: number;
  wins: number;
  winAmount: number;
  losses: number;
  lossAmount: number;
  winRate: number;
  total: number;
};

export type Stats = {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  lossRate: number;
  totalProfitLoss: number;
  averageProfit: number;
  averageLoss: number;
  long: DirectionStats;
  short: DirectionStats;
  profitability: {
    totalTrades: number;
    winRate: number;
    lossRate: number;
    wins: number;
    losses: number;
  };
};

export type Account = {
  id: string;
  name: string;
  broker: string | null;
  startingBalance: string;
  currency: string;
  createdAt: string;
  currentBalance: number;
  pnl: number;
  profitPercent: number | null;
  tradeCount: number;
  archived?: boolean;
};
