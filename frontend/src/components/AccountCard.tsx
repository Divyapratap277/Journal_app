import { useEffect, useRef, useState } from "react";
import { accountColor, cn, formatUsd, pnlClass } from "../format";
import type { Account } from "../types";

type Props = {
  account: Account;
  index?: number;
  selected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
};

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

export function AccountCard({
  account,
  index = 0,
  selected,
  onClick,
  onEdit,
  onArchive,
  onDelete,
}: Props) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = account.name;
  const idLabel = shortId(account.id);
  const badge = account.archived ? "Archived" : account.broker ? account.broker : selected ? "Active" : "Live";
  const meta = `${account.tradeCount} trades · ${account.currency}`;
  const balance = account.currentBalance;
  const pnl = account.pnl;
  const pct = account.profitPercent;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div
      className={cn(
        "lift relative w-full rounded-xl border p-3 text-left",
        selected ? "border-accent/70 bg-[#1a1c24]" : "border-line bg-[#14151b]"
      )}
    >
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: accountColor(index) }}
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-white">{name}</span>
              <span className="rounded-full bg-raised px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {badge}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[11px] font-bold text-white">ID {idLabel}</div>
            <div className="mt-0.5 truncate text-xs font-bold text-white">{meta}</div>
          </div>
        </div>
        <div className="mt-2.5 space-y-1 text-xs font-bold">
          <div className="flex justify-between text-white">
            <span>Balance:</span>
            <span className="tabular">{formatUsd(balance).replace("+", "")}</span>
          </div>
          <div className={cn("flex flex-wrap justify-between gap-x-2", pnlClass(pnl))}>
            <span className="tabular">P&L: {formatUsd(pnl)}</span>
            <span className="tabular">Profit %: {pct === null ? "—" : `${pct.toFixed(1)}%`}</span>
          </div>
        </div>
      </button>

      {onEdit || onArchive || onDelete ? (
        <div className="absolute right-2 top-2" ref={menuRef}>
          <button
            type="button"
            className="rounded-md px-1.5 py-0.5 text-zinc-500 hover:bg-raised hover:text-white"
            aria-label="Account menu"
            onClick={(e) => {
              e.stopPropagation();
              setMenu((v) => !v);
            }}
          >
            ⋯
          </button>
          {menu ? (
            <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg border border-line bg-raised py-1 text-sm shadow-xl">
              {onEdit ? (
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left hover:bg-bg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenu(false);
                    onEdit();
                  }}
                >
                  Edit
                </button>
              ) : null}
              {onArchive ? (
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left hover:bg-bg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenu(false);
                    onArchive();
                  }}
                >
                  {account.archived ? "Unarchive" : "Archive"}
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-loss hover:bg-bg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenu(false);
                    onDelete();
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
