import { useState } from "react";
import { api } from "../api";
import { useAccounts } from "../account";
import { AccountCard } from "../components/AccountCard";
import { AccountFormModal } from "../components/AccountFormModal";
import type { Account } from "../types";

export function AccountsPage() {
  const { accounts, refresh, setActiveId, activeId } = useAccounts();
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function archive(account: Account) {
    await api(`/api/accounts/${account.id}`, {
      method: "PUT",
      body: JSON.stringify({ archived: !account.archived }),
    });
    await refresh();
  }

  async function remove(account: Account) {
    if (!window.confirm(`Delete ${account.name}?`)) return;
    setError(null);
    try {
      await api("/api/accounts/" + account.id, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <button type="button" onClick={() => setCreateOpen(true)} className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white">
          New account
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-loss">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account, index) => (
          <AccountCard
            key={account.id}
            account={account}
            index={index}
            selected={activeId === account.id}
            onClick={() => setActiveId(account.id)}
            onEdit={() => setEdit(account)}
            onArchive={() => void archive(account)}
            onDelete={() => void remove(account)}
          />
        ))}
      </div>
      {accounts.length === 0 ? <p className="text-zinc-500">No accounts yet.</p> : null}
      <AccountFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AccountFormModal open={Boolean(edit)} account={edit} onClose={() => setEdit(null)} />
    </div>
  );
}
