export function suggestProfitLoss(
  direction: "BUY" | "SELL",
  quantity: string,
  entryPrice: string,
  exitPrice: string
) {
  const qty = Number(quantity);
  const entry = Number(entryPrice);
  const exit = Number(exitPrice);
  if (![qty, entry, exit].every((n) => Number.isFinite(n))) return "";
  const gross = direction === "BUY" ? (exit - entry) * qty : (entry - exit) * qty;
  return String(Number(gross.toFixed(8)));
}

export function formatMoney(value: string | number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export function formatSigned(value: number, currency = "USD") {
  const formatted = formatMoney(Math.abs(value), currency);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

/** Spec-style money: +$1.23 or -$1.23 */
export function formatUsd(value: number) {
  const core = `$${Math.abs(value).toFixed(2)}`;
  if (value < 0) return `-${core}`;
  if (value > 0) return `+${core}`;
  return core;
}

export function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

/** Compact blotter date: 19 Aug 22:45 */
export function formatBlotterDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function displayProfitLoss(trade: {
  direction: "BUY" | "SELL";
  quantity: string;
  entryPrice: string;
  exitPrice: string | null;
  profitLoss: string | null;
}) {
  if (trade.profitLoss !== null && trade.profitLoss !== "") return trade.profitLoss;
  if (trade.exitPrice) {
    return suggestProfitLoss(trade.direction, trade.quantity, trade.entryPrice, trade.exitPrice) || null;
  }
  return null;
}

export function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(value: string) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function pnlClass(value: number | string | null | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "text-zinc-400";
  return n > 0 ? "text-profit" : "text-loss";
}

export function localDayKey(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const ACCOUNT_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#2ecc71", "#e74c3c", "#06b6d4"];

export function accountColor(index: number) {
  return ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
