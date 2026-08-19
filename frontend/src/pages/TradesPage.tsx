import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { scopeTrades, useAccounts } from "../account";
import { Lightbox } from "../components/Modal";
import { TradeDetailPanel } from "../components/TradeDetailPanel";
import { cn, displayProfitLoss, formatBlotterDate, formatMoney, pnlClass } from "../format";
import { SYMBOL_GROUPS } from "../symbols";
import { riskReward } from "../trading";
import type { Trade } from "../types";

export function TradesPage() {
  const { activeAccounts, activeId, setActiveId } = useAccounts();
  const [params, setParams] = useSearchParams();
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Trade | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dense, setDense] = useState(() => localStorage.getItem("journal_table_density") === "dense");

  const filterKey = ["from", "to", "symbol", "direction", "outcome", "strategy"].map((k) => params.get(k) ?? "").join("|");

  useEffect(() => {
    const qs = new URLSearchParams();
    for (const key of ["from", "to", "symbol", "direction", "outcome", "strategy"]) {
      const v = params.get(key);
      if (v) qs.set(key, v);
    }
    qs.set("accountId", activeId || "all");
    let cancelled = false;
    api<Trade[]>(`/api/trades?${qs.toString()}`)
      .then((data) => {
        if (!cancelled) setTrades(scopeTrades(data, activeId));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load trades");
      });
    return () => {
      cancelled = true;
    };
  }, [filterKey, activeId, params]);

  const strategies = useMemo(() => {
    const set = new Set<string>();
    (trades ?? []).forEach((t) => {
      if (t.strategy) set.add(t.strategy);
    });
    return [...set].sort();
  }, [trades]);

  function onFilter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["from", "to", "symbol", "direction", "outcome", "strategy"]) {
      const v = String(form.get(key) ?? "").trim();
      if (v) next.set(key, v);
    }
    const acc = String(form.get("accountId") ?? "all");
    setActiveId(acc);
    setParams(next);
  }

  async function openDetail(id: string) {
    const full = await api<Trade>(`/api/trades/${id}`);
    setDetail(full);
  }

  function onViewShot(e: MouseEvent, url: string) {
    e.stopPropagation();
    setLightbox(url);
  }

  async function deleteTrade(id: string) {
    if (!window.confirm("Delete this trade and its screenshots?")) return;
    await api(`/api/trades/${id}`, { method: "DELETE" });
    setDetail(null);
    setTrades((prev) => prev?.filter((t) => t.id !== id) ?? null);
  }

  const pad = dense ? "px-2 py-1.5" : "px-2.5 py-2";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trades</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title={dense ? "Comfortable rows" : "Dense rows"}
            className={cn("rounded-lg border px-2 py-1.5 text-sm", dense ? "border-accent text-accent" : "border-line")}
            onClick={() => {
              const next = !dense;
              setDense(next);
              localStorage.setItem("journal_table_density", next ? "dense" : "comfortable");
            }}
          >
            {dense ? "Dense" : "Comfort"}
          </button>
          <Link to="/trades/new" className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white">
            New trade
          </Link>
        </div>
      </div>

      <form onSubmit={onFilter} className="mb-4 grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          Account
          <select
            className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case tracking-normal"
            name="accountId"
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
          >
            <option value="all">All accounts</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          From
          <input className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case" type="date" name="from" defaultValue={params.get("from") ?? ""} />
        </label>
        <label className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          To
          <input className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case" type="date" name="to" defaultValue={params.get("to") ?? ""} />
        </label>
        <label className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          Symbol
          <select className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case tracking-normal" name="symbol" defaultValue={params.get("symbol") ?? ""}>
            <option value="">All</option>
            {SYMBOL_GROUPS.map((g) => (
              <optgroup key={g.category} label={g.category}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          Direction
          <select className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case tracking-normal" name="direction" defaultValue={params.get("direction") ?? ""}>
            <option value="">All</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
        </label>
        <label className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          Result
          <select className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case tracking-normal" name="outcome" defaultValue={params.get("outcome") ?? ""}>
            <option value="">All</option>
            <option value="win">Profit</option>
            <option value="loss">Loss</option>
            <option value="be">Break even</option>
          </select>
        </label>
        <label className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          Strategy
          <input className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case tracking-normal" name="strategy" list="filter-strategies" defaultValue={params.get("strategy") ?? ""} />
          <datalist id="filter-strategies">
            {strategies.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm text-white">
            Apply
          </button>
          <button type="button" className="rounded-lg border border-line px-3 py-2 text-sm" onClick={() => setParams(new URLSearchParams())}>
            Clear
          </button>
        </div>
      </form>

      {error ? <p className="text-loss">{error}</p> : null}
      {!trades ? <p className="text-zinc-500">Loading trades…</p> : null}
      {trades && trades.length === 0 ? <p className="text-zinc-500">No trades match these filters.</p> : null}

      {trades && trades.length > 0 ? (
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-line">
          <table className={cn("w-full table-auto border-collapse text-left text-white", dense ? "text-xs" : "text-sm")}>
            <thead className="sticky top-0 bg-raised text-[11px] font-bold uppercase tracking-wider text-white">
              <tr>
                <th className={pad}>Symbol</th>
                <th className={pad}>Dir</th>
                <th className={pad}>Date</th>
                <th className={`${pad} text-right`}>P/L</th>
                <th className={pad}>R:R</th>
                <th className={pad}>Strategy</th>
                <th className={pad}>Result</th>
                <th className={pad}>Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const shot = trade.images?.[0];
                const rr = riskReward(trade);
                const pl = displayProfitLoss(trade);
                return (
                  <tr
                    key={trade.id}
                    onClick={() => void openDetail(trade.id)}
                    className="cursor-pointer border-t border-line hover:bg-raised/70"
                  >
                    <td className={`${pad} whitespace-nowrap font-semibold text-white`}>{trade.symbol}</td>
                    <td className={`${pad} whitespace-nowrap`}>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          trade.direction === "BUY" ? "bg-blue-500/15 text-blue-300" : "bg-orange-500/15 text-orange-300"
                        )}
                      >
                        {trade.direction === "BUY" ? "▲" : "▼"} {trade.direction === "BUY" ? "Buy" : "Sell"}
                      </span>
                    </td>
                    <td className={`${pad} whitespace-nowrap tabular text-white`}>{formatBlotterDate(trade.openedAt)}</td>
                    <td className={cn(pad, "whitespace-nowrap tabular text-right font-semibold", pl === null ? "text-white" : pnlClass(pl))}>
                      {pl === null ? "—" : formatMoney(pl, trade.currency)}
                    </td>
                    <td className={`${pad} whitespace-nowrap text-white`}>
                      {rr ? <span className="tabular rounded bg-raised px-1.5 py-0.5 text-[11px] font-medium text-white">{rr}</span> : "—"}
                    </td>
                    <td className={`${pad} max-w-[140px] truncate whitespace-nowrap text-white`}>{trade.strategy ?? "—"}</td>
                    <td className={cn(pad, "whitespace-nowrap font-semibold", trade.result === "Open" ? "text-white" : pnlClass(trade.result === "Win" ? 1 : trade.result === "Loss" ? -1 : 0))}>
                      {trade.result}
                    </td>
                    <td className={`${pad} whitespace-nowrap`}>
                      {shot ? (
                        <button
                          type="button"
                          className="rounded-md border border-line px-2 py-1 text-xs font-medium text-white"
                          onClick={(e) => onViewShot(e, shot.secureUrl)}
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-white">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {detail ? (
        <TradeDetailPanel trade={detail} onClose={() => setDetail(null)} onDeleted={() => void deleteTrade(detail.id)} />
      ) : null}
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
