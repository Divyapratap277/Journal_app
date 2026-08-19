import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { accountQuery, scopeTrades, useAccounts } from "../account";
import { GaugeCard } from "../components/GaugeCard";
import { cn, formatUsd, localDayKey, pnlClass } from "../format";
import { winStreak } from "../trading";
import type { Stats, Trade } from "../types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_NAMES = ["Week One", "Week Two", "Week Three", "Week Four", "Week Five", "Week Six"];

function startOfWeekSunday(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatRange(a: Date, b: Date) {
  const fmt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric" });
  return `${fmt(a)} - ${fmt(b)}`;
}

function parseDay(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function TradeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-zinc-400" fill="currentColor" aria-hidden>
      <path d="M2 12h2V6H2v6zm5 0h2V3H7v9zm5 0h2V8h-2v4z" />
    </svg>
  );
}

export function DashboardPage() {
  const { activeId } = useAccounts();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [streakTrades, setStreakTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const monthFrom = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last = new Date(year, month + 1, 0).getDate();
  const monthTo = `${year}-${String(month + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  const usingRange = Boolean(customFrom && customTo);
  const from = usingRange ? customFrom : monthFrom;
  const to = usingRange ? customTo : monthTo;
  const monthLabel = new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    const q = `from=${from}&to=${to}${accountQuery(activeId)}`;
    let cancelled = false;
    Promise.all([api<Trade[]>(`/api/trades?${q}`), api<Stats>(`/api/stats?${q}`)])
      .then(([t, s]) => {
        if (cancelled) return;
        setTrades(scopeTrades(t, activeId));
        setStats(s);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, activeId]);

  useEffect(() => {
    const start = new Date();
    start.setDate(start.getDate() - 120);
    const q = `from=${dayKey(start)}${accountQuery(activeId)}`;
    let cancelled = false;
    api<Trade[]>(`/api/trades?${q}`)
      .then((t) => {
        if (!cancelled) setStreakTrades(scopeTrades(t, activeId));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const byDay = useMemo(() => {
    const map = new Map<string, { count: number; pnl: number }>();
    for (const trade of trades) {
      const key = localDayKey(trade.openedAt);
      const prev = map.get(key) ?? { count: 0, pnl: 0 };
      prev.count += 1;
      prev.pnl += Number(trade.profitLoss ?? 0);
      map.set(key, prev);
    }
    return map;
  }, [trades]);

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = startOfWeekSunday(first);
    const end = new Date(year, month + 1, 0);
    const endGrid = startOfWeekSunday(end);
    endGrid.setDate(endGrid.getDate() + 6);
    const days: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= endGrid) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [year, month]);

  const rangeTotals = useMemo(() => {
    let pnl = 0;
    let days = 0;
    byDay.forEach((cell) => {
      if (cell.count > 0) {
        pnl += cell.pnl;
        days += 1;
      }
    });
    return { pnl, days };
  }, [byDay]);

  const weeks = useMemo(() => {
    const result: { name: string; range: string; pnl: number; days: number }[] = [];
    const weekStarts: Date[] = [];
    if (usingRange) {
      const cursor = startOfWeekSunday(parseDay(customFrom));
      const end = parseDay(customTo);
      while (cursor <= end) {
        weekStarts.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 7);
      }
    } else {
      for (let i = 0; i < grid.length; i += 7) {
        const slice = grid.slice(i, i + 7);
        if (!slice.some((d) => d.getMonth() === month)) continue;
        weekStarts.push(slice[0]);
      }
    }
    weekStarts.forEach((start, idx) => {
      const slice: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        slice.push(d);
      }
      let pnl = 0;
      let tradingDays = 0;
      for (const d of slice) {
        const key = dayKey(d);
        if (usingRange && (key < customFrom || key > customTo)) continue;
        const cell = byDay.get(key);
        if (cell && cell.count > 0) {
          tradingDays += 1;
          pnl += cell.pnl;
        }
      }
      result.push({
        name: WEEK_NAMES[idx] ?? `Week ${idx + 1}`,
        range: formatRange(slice[0], slice[slice.length - 1]),
        pnl,
        days: tradingDays,
      });
    });
    return result;
  }, [grid, byDay, month, usingRange, customFrom, customTo]);

  const streak = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of streakTrades) {
      const key = localDayKey(t.openedAt);
      map.set(key, (map.get(key) ?? 0) + Number(t.profitLoss ?? 0));
    }
    return winStreak([...map.entries()].map(([key, pnl]) => ({ key, pnl })));
  }, [streakTrades]);

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setCustomFrom("");
    setCustomTo("");
  }

  async function share() {
    const text = `Daily Summary — ${usingRange ? `${customFrom} to ${customTo}` : monthLabel}\nPnL: ${formatUsd(rangeTotals.pnl)}\nDays: ${rangeTotals.days}`;
    try {
      if (navigator.share) await navigator.share({ title: "Daily Summary", text });
      else {
        await navigator.clipboard.writeText(text);
        setShareNote("Copied");
        setTimeout(() => setShareNote(null), 1500);
      }
    } catch {
      await navigator.clipboard.writeText(text);
      setShareNote("Copied");
      setTimeout(() => setShareNote(null), 1500);
    }
  }

  if (error) return <p className="text-loss">{error}</p>;

  const today = new Date();
  const todayKey = dayKey(today);
  const currency = "USD";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Daily Summary</h1>
          {streak ? (
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                streak.kind === "win" ? "border-profit/40 text-profit" : "border-loss/40 text-loss"
              )}
            >
              {streak.count}-day {streak.kind} streak
            </span>
          ) : null}
        </div>
        <button type="button" onClick={() => void share()} className="rounded-lg border border-line bg-raised px-3 py-1.5 text-sm hover:border-accent">
          {shareNote ?? "Share"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Previous month" className="rounded-lg border border-line px-2 py-1.5 text-sm" onClick={() => shift(-1)}>
            ‹
          </button>
          <button type="button" aria-label="Next month" className="rounded-lg border border-line px-2 py-1.5 text-sm" onClick={() => shift(1)}>
            ›
          </button>
          <div className="min-w-36 px-1 font-medium">{monthLabel}</div>
          <button
            type="button"
            className="rounded-lg bg-raised px-3 py-1.5 text-sm"
            onClick={() => {
              const n = new Date();
              setYear(n.getFullYear());
              setMonth(n.getMonth());
              setCustomFrom("");
              setCustomTo("");
            }}
          >
            Today
          </button>
          <button
            type="button"
            className={cn("rounded-lg border px-3 py-1.5 text-sm", pickerOpen || usingRange ? "border-accent text-accent" : "border-line")}
            onClick={() => setPickerOpen((v) => !v)}
          >
            Pick dates
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("tabular rounded-full border border-line bg-raised px-3 py-1 text-sm", pnlClass(rangeTotals.pnl))}>
            PnL: {formatUsd(rangeTotals.pnl)}
          </span>
          <span className="tabular rounded-full border border-line bg-raised px-3 py-1 text-sm text-zinc-300">Days: {rangeTotals.days}</span>
        </div>
      </div>

      {pickerOpen ? (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-3">
          <label className="text-xs uppercase tracking-wider text-zinc-500">
            Start
            <input className="mt-1 block rounded-lg px-2 py-1.5" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-wider text-zinc-500">
            End
            <input className="mt-1 block rounded-lg px-2 py-1.5" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </label>
          <button
            type="button"
            className="rounded-lg border border-line px-3 py-1.5 text-sm"
            onClick={() => {
              setCustomFrom("");
              setCustomTo("");
              setPickerOpen(false);
            }}
          >
            Clear range
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="grid grid-cols-7 gap-1.5 text-center text-zinc-500">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 text-[13px] font-medium uppercase tracking-[0.12em]">
                {d}
              </div>
            ))}
            {grid.map((d) => {
              const inMonth = d.getMonth() === month;
              const key = dayKey(d);
              const cell = byDay.get(key);
              const has = Boolean(cell && cell.count > 0);
              const isToday = key === todayKey;
              const inCustom = !usingRange || (key >= customFrom && key <= customTo);
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[96px] rounded-lg border p-2 text-left",
                    inMonth ? "border-line bg-bg" : "border-transparent bg-transparent opacity-35",
                    isToday && inMonth && "border-accent bg-accent/10",
                    has && inMonth && "lift"
                  )}
                >
                  <div className={cn("text-[15px] leading-none", isToday && inMonth ? "font-semibold text-accent" : "text-zinc-400")}>
                    {d.getDate()}
                  </div>
                  {has && inMonth && inCustom ? (
                    <div className="mt-1.5">
                      <div className="flex items-center gap-1 text-[13px] text-zinc-400">
                        <TradeIcon />
                        <span className="tabular">{cell!.count}</span>
                      </div>
                      <div className={cn("tabular mt-0.5 text-[13px] font-medium", pnlClass(cell!.pnl))}>{formatUsd(cell!.pnl)}</div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Weekly Summary</h2>
          <div className="space-y-3">
            {weeks.map((w) => (
              <div key={w.name + w.range} className="lift rounded-xl border border-line bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">{w.name}</div>
                  <div className="text-xs text-zinc-500">{w.range}</div>
                </div>
                {w.days === 0 ? (
                  <div className="mt-2 text-xs text-zinc-500">No trades</div>
                ) : (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className={cn("tabular", pnlClass(w.pnl))}>PnL: {formatUsd(w.pnl)}</span>
                    <span className="tabular text-zinc-400">Days: {w.days}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <GaugeCard
          title="Short Analysis"
          variant="direction"
          centerValue={stats ? formatUsd(stats.short.net) : "—"}
          centerValueClass={stats ? pnlClass(stats.short.net) : ""}
          winRate={stats?.short.winRate ?? 0}
          wins={stats?.short.wins ?? 0}
          winAmount={stats?.short.winAmount ?? 0}
          losses={stats?.short.losses ?? 0}
          lossAmount={stats?.short.lossAmount ?? 0}
          currency={currency}
        />
        <GaugeCard
          title="Profitability"
          variant="profitability"
          centerValue={stats ? String(stats.profitability.totalTrades) : "0"}
          winRate={stats?.profitability.winRate ?? 0}
          lossRate={stats?.profitability.lossRate ?? 0}
          wins={stats?.profitability.wins ?? 0}
          winAmount={0}
          losses={stats?.profitability.losses ?? 0}
          lossAmount={0}
        />
        <GaugeCard
          title="Long Analysis"
          variant="direction"
          centerValue={stats ? formatUsd(stats.long.net) : "—"}
          centerValueClass={stats ? pnlClass(stats.long.net) : ""}
          winRate={stats?.long.winRate ?? 0}
          wins={stats?.long.wins ?? 0}
          winAmount={stats?.long.winAmount ?? 0}
          losses={stats?.long.losses ?? 0}
          lossAmount={stats?.long.lossAmount ?? 0}
          currency={currency}
        />
      </div>
    </div>
  );
}
