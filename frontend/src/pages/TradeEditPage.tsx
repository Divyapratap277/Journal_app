import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAccounts } from "../account";
import { TradeForm } from "../components/TradeForm";
import type { Trade, TradeImage, TradePayload } from "../types";

async function uploadImages(tradeId: string, files: File[]) {
  if (files.length === 0) return;
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  await api(`/api/trades/${tradeId}/images`, { method: "POST", body: form });
}

export function TradeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refresh } = useAccounts();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([api<Trade>(`/api/trades/${id}`), api<Trade[]>("/api/trades")])
      .then(([current, all]) => {
        setTrade(current);
        const set = new Set<string>();
        all.forEach((t) => {
          if (t.strategy) set.add(t.strategy);
        });
        setStrategies([...set].sort());
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load trade"));
  }, [id]);

  async function removeImage(image: TradeImage) {
    if (!id || !window.confirm(`Remove ${image.fileName}?`)) return;
    await api(`/api/trades/${id}/images/${image.id}`, { method: "DELETE" });
    setTrade((prev) =>
      prev ? { ...prev, images: (prev.images ?? []).filter((img) => img.id !== image.id) } : prev
    );
  }

  if (error) return <p className="text-loss">{error}</p>;
  if (!trade) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Edit trade</h1>
      {trade.images && trade.images.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {trade.images.map((img) => (
            <div key={img.id} className="rounded-xl border border-line p-2">
              <img src={img.secureUrl} alt={img.fileName} className="h-32 w-full rounded-lg object-cover" />
              <button type="button" className="mt-2 text-sm text-loss underline" onClick={() => void removeImage(img)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <TradeForm
        trade={trade}
        strategies={strategies}
        submitLabel="Update trade"
        onSubmit={async (payload: TradePayload, files) => {
          await api(`/api/trades/${trade.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          await uploadImages(trade.id, files);
          await refresh();
          navigate("/trades");
        }}
      />
    </div>
  );
}
