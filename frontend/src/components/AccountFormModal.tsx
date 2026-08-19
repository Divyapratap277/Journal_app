import { useEffect, useState } from "react";
import { api } from "../api";
import { useAccounts } from "../account";
import { Modal } from "./Modal";
import type { Account } from "../types";

export function AccountFormModal({
  open,
  onClose,
  account,
}: {
  open: boolean;
  onClose: () => void;
  account?: Account | null;
}) {
  const { refresh, setActiveId } = useAccounts();
  const isEdit = Boolean(account);
  const [name, setName] = useState("");
  const [broker, setBroker] = useState("");
  const [startingBalance, setStartingBalance] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(account?.name ?? "");
    setBroker(account?.broker ?? "");
    setStartingBalance(account?.startingBalance ?? "0");
    setCurrency(account?.currency ?? "USD");
  }, [open, account]);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      if (isEdit && account) {
        await api<Account[]>(`/api/accounts/${account.id}`, {
          method: "PUT",
          body: JSON.stringify({ name, broker, startingBalance, currency }),
        });
        await refresh();
      } else {
        const list = await api<Account[]>("/api/accounts", {
          method: "POST",
          body: JSON.stringify({ name, broker, startingBalance, currency }),
        });
        await refresh();
        const created = list[list.length - 1];
        if (created) setActiveId(created.id);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={isEdit ? "Edit account" : "New account"} onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-sm text-zinc-400">
          Name
          <input className="mt-1 w-full rounded-lg px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm text-zinc-400">
          Broker / prop firm (optional)
          <input className="mt-1 w-full rounded-lg px-3 py-2" value={broker} onChange={(e) => setBroker(e.target.value)} />
        </label>
        <label className="block text-sm text-zinc-400">
          Starting balance
          <input className="tabular mt-1 w-full rounded-lg px-3 py-2" value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)} />
        </label>
        <label className="block text-sm text-zinc-400">
          Currency
          <input className="mt-1 w-full rounded-lg px-3 py-2" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </label>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void submit()}
          className="w-full rounded-lg bg-accent py-2 font-medium text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create account"}
        </button>
      </div>
    </Modal>
  );
}
