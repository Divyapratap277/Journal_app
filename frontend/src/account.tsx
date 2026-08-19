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
  const [activeId, setActiveIdState] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "all");
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
    if (activeId === "all") return;
    if (accounts.length === 0) return;
    const found = accounts.find((a) => a.id === activeId);
    if (!found || found.archived) setActiveId("all");
  }, [accounts, activeId, setActiveId]);

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

/** Always send accountId so the API never defaults to unscoped "all trades". */
export function accountQuery(activeId: string) {
  const id = !activeId || activeId === "all" ? "all" : activeId;
  return `&accountId=${encodeURIComponent(id)}`;
}

export function scopeTrades<T extends { accountId: string }>(trades: T[], activeId: string) {
  if (!activeId || activeId === "all") return trades;
  return trades.filter((t) => t.accountId === activeId);
}
