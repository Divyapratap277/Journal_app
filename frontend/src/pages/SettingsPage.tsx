import { useAuth } from "../auth";

export function SettingsPage() {
  const { logout } = useAuth();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-2 text-sm text-zinc-400">
        This journal is single-user. Accounts in the sidebar are your trading accounts, not separate logins.
      </p>
      <p className="mt-4 text-sm text-zinc-400">
        Add symbols in <code className="text-zinc-200">frontend/src/symbols.ts</code>. Screenshots stay on Cloudinary;
        balances live in Postgres.
      </p>
      <button type="button" onClick={logout} className="mt-6 rounded-lg border border-line px-3 py-2 text-sm">
        Log out
      </button>
    </div>
  );
}
