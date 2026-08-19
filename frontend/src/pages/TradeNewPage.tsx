import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAccounts } from "../account";
import { TradeForm } from "../components/TradeForm";
import type { Trade, TradePayload } from "../types";

async function uploadImages(tradeId: string, files: File[]) {
  if (files.length === 0) return;
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  await api(`/api/trades/${tradeId}/images`, { method: "POST", body: form });
}

export function TradeNewPage() {
  const navigate = useNavigate();
  const { refresh } = useAccounts();
  const [strategies, setStrategies] = useState<string[]>([]);

  useEffect(() => {
    api<Trade[]>("/api/trades")
      .then((trades) => {
        const set = new Set<string>();
        trades.forEach((t) => {
          if (t.strategy) set.add(t.strategy);
        });
        setStrategies([...set].sort());
      })
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">New trade</h1>
      <TradeForm
        strategies={strategies}
        submitLabel="Save trade"
        onSubmit={async (payload: TradePayload, files) => {
          const created = await api<Trade>("/api/trades", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          await uploadImages(created.id, files);
          await refresh();
          navigate("/trades");
        }}
      />
    </div>
  );
}
