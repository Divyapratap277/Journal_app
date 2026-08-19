import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { IconRail } from "./IconRail";
import { AccountPanel } from "./AccountPanel";
import { AccountFormModal } from "./AccountFormModal";
import { currentSession, formatClock } from "../trading";
import type { Account } from "../types";

export function Layout() {
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Account | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen bg-bg text-zinc-100">
      <IconRail />
      <AccountPanel onNewAccount={() => setCreateOpen(true)} onEdit={setEdit} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-end gap-4 border-b border-line bg-[#101117] px-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{currentSession(now)}</div>
          <div className="tabular text-sm text-zinc-200">{formatClock(now)}</div>
        </header>
        <main className="min-w-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <AccountFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AccountFormModal open={Boolean(edit)} account={edit} onClose={() => setEdit(null)} />
    </div>
  );
}
