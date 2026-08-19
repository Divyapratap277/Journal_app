import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";

type AuthContextValue = {
  token: string | null;
  ready: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = getToken();
    if (!existing) {
      setReady(true);
      return;
    }
    api("/api/me")
      .then(() => setTokenState(existing))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      ready,
      login: async (password: string) => {
        const data = await api<{ token: string }>("/api/login", {
          method: "POST",
          body: JSON.stringify({ password }),
        });
        setToken(data.token);
        setTokenState(data.token);
      },
      logout: () => {
        setToken(null);
        setTokenState(null);
      },
    }),
    [token, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
