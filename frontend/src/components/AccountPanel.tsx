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
        <div className="text-xs font-bold uppercase tracking-wide text-white">Accounts</div>
        <button type="button" onClick={onNewAccount} className="mt-2 w-full rounded-lg bg-accent py-1.5 text-sm font-medium text-white">
          + New
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
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
