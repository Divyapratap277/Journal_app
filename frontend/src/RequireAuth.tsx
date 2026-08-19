import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./auth";

export function RequireAuth() {
  const { token, ready } = useAuth();
  if (!ready) return <p className="min-h-screen bg-bg p-6 text-zinc-400">Loading…</p>;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
