import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { scopeTrades, useAccounts } from "../account";
import { KebabMenu } from "../components/KebabMenu";
import { Lightbox } from "../components/Modal";
import { TradeDetailPanel } from "../components/TradeDetailPanel";
import { cn, formatBlotterDate } from "../format";
import { SYMBOL_GROUPS } from "../symbols";
import { riskReward } from "../trading";
import type { Trade } from "../types";

export function TradesPage() {
  const { activeId } = useAccounts();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Trade | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filterKey = ["from", "to", "symbol", "direction", "outcome", "strategy"].map((k) => params.get(k) ?? "").join("|");

  useEffect(() => {
    if (!activeId) {
      setTrades([]);
      return;
    }
    const qs = new URLSearchParams();
    for (const key of ["from", "to", "symbol", "direction", "outcome", "strategy"]) {
      const v = params.get(key);
      if (v) qs.set(key, v);
    }
    qs.set("accountId", activeId);
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

  const pad = "px-3 py-2.5";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trades</h1>
        <Link to="/trades/new" className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white">
          New trade
        </Link>
      </div>

      <form onSubmit={onFilter} className="mb-4 grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-bold uppercase tracking-wide text-white">
          From
          <input className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case" type="date" name="from" defaultValue={params.get("from") ?? ""} />
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-white">
          To
          <input className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case" type="date" name="to" defaultValue={params.get("to") ?? ""} />
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-white">
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
        <label className="text-xs font-bold uppercase tracking-wide text-white">
          Direction
          <select className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case tracking-normal" name="direction" defaultValue={params.get("direction") ?? ""}>
            <option value="">All</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-white">
          Win/Loss
          <select className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm normal-case tracking-normal" name="outcome" defaultValue={params.get("outcome") ?? ""}>
            <option value="">All</option>
            <option value="win">Profit</option>
            <option value="loss">Loss</option>
            <option value="be">Break even</option>
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-white">
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
          <table className="w-full table-auto border-collapse text-left text-sm text-white">
            <thead className="sticky top-0 bg-raised text-xs font-bold uppercase tracking-wide text-white">
              <tr>
                <th className={pad}>Symbol</th>
                <th className={pad}>Dir</th>
                <th className={pad}>Date</th>
                <th className={pad}>Win/Loss</th>
                <th className={pad}>R:R</th>
                <th className={pad}>Strategy</th>
                <th className={pad}>Screenshot</th>
                <th className={`${pad} w-10`} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const shot = trade.images?.[0];
                const rr = riskReward(trade);
                const outcome =
                  trade.result === "Win" ? "Win" : trade.result === "Loss" ? "Loss" : trade.result === "BE" ? "BE" : "Open";
                return (
                  <tr
                    key={trade.id}
                    onClick={() => void openDetail(trade.id)}
                    className="cursor-pointer border-t border-line hover:bg-raised/70"
                  >
                    <td className={`${pad} whitespace-nowrap font-bold text-white`}>{trade.symbol}</td>
                    <td className={`${pad} whitespace-nowrap`}>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                          trade.direction === "BUY" ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
                        )}
                      >
                        {trade.direction === "BUY" ? "▲ Buy" : "▼ Sell"}
                      </span>
                    </td>
                    <td className={`${pad} whitespace-nowrap tabular font-semibold text-white`}>{formatBlotterDate(trade.openedAt)}</td>
                    <td
                      className={cn(
                        pad,
                        "whitespace-nowrap font-bold",
                        outcome === "Win" && "text-profit",
                        outcome === "Loss" && "text-loss",
                        (outcome === "Open" || outcome === "BE") && "text-white"
                      )}
                    >
                      {outcome}
                    </td>
                    <td className={`${pad} whitespace-nowrap font-semibold text-white`}>
                      {rr ? <span className="tabular rounded bg-raised px-1.5 py-0.5 text-xs font-bold text-white">{rr}</span> : "—"}
                    </td>
                    <td className={`${pad} max-w-[140px] truncate whitespace-nowrap font-semibold text-white`}>{trade.strategy ?? "—"}</td>
                    <td className={`${pad} whitespace-nowrap`}>
                      {shot ? (
                        <button
                          type="button"
                          className="rounded-md border border-line px-2 py-1 text-xs font-bold text-white"
                          onClick={(e) => onViewShot(e, shot.secureUrl)}
                        >
                          View
                        </button>
                      ) : (
                        <span className="font-semibold text-white">—</span>
                      )}
                    </td>
                    <td className={pad} onClick={(e) => e.stopPropagation()}>
                      <KebabMenu
                        label="Trade menu"
                        items={[
                          { label: "Edit", onSelect: () => navigate(`/trades/${trade.id}/edit`) },
                          { label: "Delete", danger: true, onSelect: () => void deleteTrade(trade.id) },
                        ]}
                      />
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
