import type { Direction } from "./types";

export function riskReward(input: {
  direction: Direction;
  entryPrice: string;
  stopLoss: string | null;
  takeProfit: string | null;
}) {
  if (!input.stopLoss || !input.takeProfit) return null;
  const entry = Number(input.entryPrice);
  const sl = Number(input.stopLoss);
  const tp = Number(input.takeProfit);
  if (![entry, sl, tp].every((n) => Number.isFinite(n))) return null;
  const risk = input.direction === "BUY" ? entry - sl : sl - entry;
  const reward = input.direction === "BUY" ? tp - entry : entry - tp;
  if (risk <= 0 || reward <= 0) return null;
  const ratio = reward / risk;
  return `1:${ratio.toFixed(ratio >= 10 ? 1 : 2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}`;
}

export function currentSession(date = new Date()) {
  const h = date.getUTCHours() + date.getUTCMinutes() / 60;
  const parts: string[] = [];
  if (h >= 0 && h < 9) parts.push("Asian");
  if (h >= 7 && h < 16) parts.push("London");
  if (h >= 12 && h < 21) parts.push("New York");
  return parts.length ? parts.join(" / ") : "Off-session";
}

export function formatClock(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function winStreak(dayPnls: { key: string; pnl: number }[]) {
  const days = [...dayPnls].sort((a, b) => (a.key < b.key ? 1 : -1)).filter((d) => d.pnl !== 0);
  if (days.length === 0) return null;
  const sign = days[0].pnl > 0 ? 1 : -1;
  let count = 0;
  for (const d of days) {
    if ((d.pnl > 0 ? 1 : -1) !== sign) break;
    count += 1;
  }
  if (count === 0) return null;
  return { count, kind: sign > 0 ? "win" : "loss" as const };
}
