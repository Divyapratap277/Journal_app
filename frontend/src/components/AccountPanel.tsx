import { api } from "../api";
import { useAccounts } from "../account";
import { AccountCard } from "./AccountCard";
import type { Account } from "../types";

export function AccountPanel({
  onNewAccount,
  onEdit,
}: {
  onNewAccount: () => void;
  onEdit: (account: Account) => void;
}) {
  const { accounts, activeAccounts, activeId, setActiveId, refresh } = useAccounts();
  const visible = activeAccounts;

  const allPnl = visible.reduce((s, a) => s + a.pnl, 0);
  const allBalance = visible.reduce((s, a) => s + a.currentBalance, 0);
  const allTrades = visible.reduce((s, a) => s + a.tradeCount, 0);
  const startSum = visible.reduce((s, a) => s + Number(a.startingBalance), 0);
  const allPct = startSum === 0 ? (allPnl === 0 ? 0 : null) : (allPnl / startSum) * 100;

  async function archive(account: Account) {
    await api(`/api/accounts/${account.id}`, {
      method: "PUT",
      body: JSON.stringify({ archived: !account.archived }),
    });
    await refresh();
  }

  async function remove(account: Account) {
    const ok = window.confirm(`Delete ${account.name}? This cannot be undone.`);
    if (!ok) return;
    try {
      await api(`/api/accounts/${account.id}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not delete account");
    }
  }

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-3 py-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Accounts</div>
        <button type="button" onClick={onNewAccount} className="mt-2 w-full rounded-lg bg-accent py-1.5 text-sm font-medium text-white">
          + New
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <AccountCard
          selected={activeId === "all"}
          onClick={() => setActiveId("all")}
          aggregated={{ balance: allBalance, pnl: allPnl, profitPercent: allPct, tradeCount: allTrades }}
        />
        {visible.map((account, index) => (
          <AccountCard
            key={account.id}
            account={account}
            index={index}
            selected={activeId === account.id}
            onClick={() => setActiveId(account.id)}
            onEdit={() => onEdit(account)}
            onArchive={() => void archive(account)}
            onDelete={() => void remove(account)}
          />
        ))}
        {accounts.some((a) => a.archived) ? (
          <p className="px-1 text-[11px] text-zinc-600">Archived accounts are hidden here. Restore them from Accounts.</p>
        ) : null}
      </div>
    </aside>
  );
}
