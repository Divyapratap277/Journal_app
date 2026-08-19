import { api } from "./api";
import type { Account } from "./types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "journal_active_account";

type AccountContextValue = {
  accounts: Account[];
  activeAccounts: Account[];
  activeId: string;
  setActiveId: (id: string) => void;
  refresh: () => Promise<void>;
  ready: boolean;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveIdState] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const data = await api<Account[]>("/api/accounts");
    setAccounts(data);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh().catch(() => setReady(true));
  }, [refresh]);

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  useEffect(() => {
    if (activeAccounts.length === 0) return;
    const found = activeAccounts.find((a) => a.id === activeId);
    if (!found) setActiveId(activeAccounts[0].id);
  }, [activeAccounts, activeId, setActiveId]);

  const value = useMemo(
    () => ({ accounts, activeAccounts, activeId, setActiveId, refresh, ready }),
    [accounts, activeAccounts, activeId, setActiveId, refresh, ready]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccounts() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccounts must be used within AccountProvider");
  return ctx;
}

/** Always send a real account id. Empty means no accounts yet. */
export function accountQuery(activeId: string) {
  if (!activeId || activeId === "all") return "";
  return `&accountId=${encodeURIComponent(activeId)}`;
}

export function scopeTrades<T extends { accountId: string }>(trades: T[], activeId: string) {
  if (!activeId || activeId === "all") return [];
  return trades.filter((t) => t.accountId === activeId);
}
