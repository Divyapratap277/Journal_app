import { Link } from "react-router-dom";
import { cn, displayProfitLoss, formatDateTime, formatMoney } from "../format";
import { riskReward } from "../trading";
import type { Trade } from "../types";
import { useAccounts } from "../account";

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="grid gap-1 border-b border-line py-2.5 sm:grid-cols-3">
      <div className="text-xs font-bold uppercase tracking-wide text-white">{label}</div>
      <div className={cn("text-sm font-bold sm:col-span-2 whitespace-pre-wrap tabular text-white", valueClass)}>{value || "—"}</div>
    </div>
  );
}

export function TradeDetailPanel({
  trade,
  onClose,
  onDeleted,
}: {
  trade: Trade;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { accounts } = useAccounts();
  const account = accounts.find((a) => a.id === trade.accountId);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" className="flex-1 bg-black/50" aria-label="Close panel" onClick={onClose} />
      <aside className="h-full w-full max-w-lg overflow-y-auto border-l border-line bg-surface p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{trade.symbol}</h2>
            <p className={cn("text-sm font-bold", trade.direction === "BUY" ? "text-profit" : "text-loss")}>
              {trade.direction === "BUY" ? "▲ Buy" : "▼ Sell"}{" "}
              <span className="font-bold text-white">· {formatDateTime(trade.openedAt)}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
        <Row label="Account" value={account?.name ?? trade.accountId} />
        <Row label="Quantity" value={trade.quantity} />
        <Row label="Entry" value={trade.entryPrice} />
        <Row label="Exit" value={trade.exitPrice ?? ""} />
        <Row label="Stop loss" value={trade.stopLoss ?? ""} />
        <Row label="Risk:Reward" value={riskReward(trade) ?? ""} />
        <Row label="Profit/loss" value={formatMoney(displayProfitLoss(trade), trade.currency)} />
        <Row
          label="Win/Loss"
          value={trade.result}
          valueClass={trade.result === "Win" ? "text-profit" : trade.result === "Loss" ? "text-loss" : "text-white"}
        />
        <Row label="Strategy" value={trade.strategy ?? ""} />
        <Row label="Entry reason" value={trade.entryReason ?? ""} />
        <Row label="Followed plan" value={trade.followedPlan === true ? "Yes" : trade.followedPlan === false ? "No" : ""} />
        <Row label="Emotional state" value={trade.emotionalState ?? ""} />
        <Row label="Mistake" value={trade.mistake ?? ""} />
        <Row label="Lesson" value={trade.lesson ?? ""} />
        <Row label="Notes" value={trade.notes ?? ""} />

        <h3 className="mt-4 text-sm font-bold text-white">Screenshots</h3>
        {!trade.images?.length ? (
          <p className="mt-2 text-sm text-zinc-500">No screenshots.</p>
        ) : (
          <div className="mt-2 grid gap-3">
            {trade.images.map((img) => (
              <img key={img.id} src={img.secureUrl} alt={img.fileName} className="w-full rounded-lg" />
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <Link to={`/trades/${trade.id}/edit`} className="rounded-lg border border-line px-3 py-2 text-sm">
            Edit
          </Link>
          {onDeleted ? (
            <button
              type="button"
              className="rounded-lg border border-loss/40 px-3 py-2 text-sm text-loss"
              onClick={onDeleted}
            >
              Delete
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
