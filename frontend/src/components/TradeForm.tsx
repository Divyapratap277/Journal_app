import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Trade, TradePayload } from "../types";
import { fromDatetimeLocal, suggestProfitLoss, toDatetimeLocal } from "../format";
import { SYMBOL_GROUPS, ALL_SYMBOLS } from "../symbols";
import { useAccounts } from "../account";

export type TradeFormValues = {
  accountId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  quantity: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  openedAt: string;
  profitLoss: string;
  currency: string;
  strategy: string;
  entryReason: string;
  followedPlan: "" | "yes" | "no";
  emotionalState: string;
  mistake: string;
  lesson: string;
  notes: string;
};

function emptyValues(accountId: string): TradeFormValues {
  return {
    accountId,
    symbol: "EURUSD",
    direction: "BUY",
    quantity: "",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    openedAt: toDatetimeLocal(new Date().toISOString()),
    profitLoss: "",
    currency: "USD",
    strategy: "",
    entryReason: "",
    followedPlan: "",
    emotionalState: "",
    mistake: "",
    lesson: "",
    notes: "",
  };
}

function fromTrade(trade: Trade): TradeFormValues {
  return {
    accountId: trade.accountId,
    symbol: trade.symbol,
    direction: trade.direction,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice ?? "",
    stopLoss: trade.stopLoss ?? "",
    takeProfit: trade.takeProfit ?? "",
    openedAt: toDatetimeLocal(trade.openedAt),
    profitLoss: trade.profitLoss ?? "",
    currency: trade.currency,
    strategy: trade.strategy ?? "",
    entryReason: trade.entryReason ?? "",
    followedPlan: trade.followedPlan === true ? "yes" : trade.followedPlan === false ? "no" : "",
    emotionalState: trade.emotionalState ?? "",
    mistake: trade.mistake ?? "",
    lesson: trade.lesson ?? "",
    notes: trade.notes ?? "",
  };
}

export function toPayload(values: TradeFormValues): TradePayload {
  const payload: TradePayload = {
    accountId: values.accountId,
    symbol: values.symbol,
    direction: values.direction,
    quantity: values.quantity,
    entryPrice: values.entryPrice,
    openedAt: fromDatetimeLocal(values.openedAt) ?? new Date().toISOString(),
    currency: values.currency || "USD",
  };
  if (values.exitPrice) payload.exitPrice = values.exitPrice;
  if (values.stopLoss) payload.stopLoss = values.stopLoss;
  if (values.takeProfit) payload.takeProfit = values.takeProfit;
  if (values.profitLoss) payload.profitLoss = values.profitLoss;
  if (values.strategy) payload.strategy = values.strategy;
  if (values.entryReason) payload.entryReason = values.entryReason;
  if (values.followedPlan === "yes") payload.followedPlan = true;
  if (values.followedPlan === "no") payload.followedPlan = false;
  if (values.emotionalState) payload.emotionalState = values.emotionalState;
  if (values.mistake) payload.mistake = values.mistake;
  if (values.lesson) payload.lesson = values.lesson;
  if (values.notes) payload.notes = values.notes;
  return payload;
}

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function filesFromClipboard(data: DataTransfer | null) {
  if (!data) return [];
  const out: File[] = [];
  const stamp = Date.now();
  const items = Array.from(data.items ?? []);
  items.forEach((item, index) => {
    if (!item.type.startsWith("image/")) return;
    const blob = item.getAsFile();
    if (!blob) return;
    const type = ALLOWED_IMAGE_TYPES.has(blob.type) ? blob.type : "image/png";
    const ext = type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
    const name = blob.name && blob.name !== "image.png" ? blob.name : `screenshot-${stamp}-${index}.${ext}`;
    out.push(new File([blob], name, { type }));
  });
  return out;
}

const field = "mt-1 w-full rounded-lg px-3 py-2";
const label = "block text-sm font-medium text-zinc-400";

type Props = {
  trade?: Trade;
  strategies?: string[];
  submitLabel: string;
  onSubmit: (payload: TradePayload, files: File[]) => Promise<void>;
};

export function TradeForm({ trade, strategies = [], submitLabel, onSubmit }: Props) {
  const { accounts, activeId } = useAccounts();
  const defaultAccount = trade?.accountId ?? activeId ?? "";
  const [values, setValues] = useState<TradeFormValues>(trade ? fromTrade(trade) : emptyValues(defaultAccount));
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const pasted = filesFromClipboard(e.clipboardData);
      if (pasted.length === 0) return;
      e.preventDefault();
      setFiles((prev) => [...prev, ...pasted]);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  useEffect(() => {
    if (trade) setValues(fromTrade(trade));
  }, [trade]);

  useEffect(() => {
    if (trade) return;
    const preferred = accounts.some((a) => a.id === activeId) ? activeId : accounts[0]?.id;
    if (preferred && values.accountId !== preferred && !accounts.some((a) => a.id === values.accountId)) {
      setValues((prev) => ({ ...prev, accountId: preferred }));
    }
  }, [accounts, activeId, trade, values.accountId]);

  const suggested = useMemo(
    () => suggestProfitLoss(values.direction, values.quantity, values.entryPrice, values.exitPrice),
    [values.direction, values.quantity, values.entryPrice, values.exitPrice]
  );

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function set<K extends keyof TradeFormValues>(key: K, value: TradeFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(toPayload(values), files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save trade");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p> : null}

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold text-white">Trade</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className={label}>
            Account
            <select className={field} required value={values.accountId} onChange={(e) => set("accountId", e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Symbol
            <select className={field} required value={values.symbol} onChange={(e) => set("symbol", e.target.value)}>
              {!ALL_SYMBOLS.includes(values.symbol) && values.symbol ? (
                <option value={values.symbol}>{values.symbol}</option>
              ) : null}
              {SYMBOL_GROUPS.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className={label}>
            Direction
            <select className={field} value={values.direction} onChange={(e) => set("direction", e.target.value as "BUY" | "SELL")}>
              <option value="BUY">Buy / Long</option>
              <option value="SELL">Sell / Short</option>
            </select>
          </label>
          <label className={label}>
            Quantity / lot size
            <input className={field} required inputMode="decimal" placeholder="e.g. 0.1" value={values.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </label>
          <label className={label}>
            Entry price
            <input className={field} required inputMode="decimal" value={values.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} />
          </label>
          <label className={label}>
            Exit price
            <input className={field} inputMode="decimal" placeholder="Optional if still open" value={values.exitPrice} onChange={(e) => set("exitPrice", e.target.value)} />
          </label>
          <label className={label}>
            Stop loss
            <input className={field} inputMode="decimal" value={values.stopLoss} onChange={(e) => set("stopLoss", e.target.value)} />
          </label>
          <label className={label}>
            Take profit
            <input className={field} inputMode="decimal" value={values.takeProfit} onChange={(e) => set("takeProfit", e.target.value)} />
          </label>
          <label className={label}>
            Open date and time
            <input className={field} type="datetime-local" required value={values.openedAt} onChange={(e) => set("openedAt", e.target.value)} />
          </label>
          <label className={label}>
            Profit or loss
            <input className={field} inputMode="decimal" placeholder="Optional if still open" value={values.profitLoss} onChange={(e) => set("profitLoss", e.target.value)} />
            {suggested ? (
              <button type="button" className="mt-1 text-xs text-profit underline" onClick={() => set("profitLoss", suggested)}>
                Use calculated P/L ({suggested})
              </button>
            ) : null}
          </label>
          <label className={label}>
            Currency
            <input className={field} value={values.currency} onChange={(e) => set("currency", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold text-white">Analysis</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Strategy / setup
            <input className={field} list="strategy-list" value={values.strategy} onChange={(e) => set("strategy", e.target.value)} />
            <datalist id="strategy-list">
              {strategies.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className={label}>
            Followed trading plan
            <select className={field} value={values.followedPlan} onChange={(e) => set("followedPlan", e.target.value as TradeFormValues["followedPlan"])}>
              <option value="">Not specified</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className={`${label} sm:col-span-2`}>
            Reason for entering
            <textarea className={field} rows={3} value={values.entryReason} onChange={(e) => set("entryReason", e.target.value)} />
          </label>
          <label className={label}>
            Emotional state
            <input className={field} value={values.emotionalState} onChange={(e) => set("emotionalState", e.target.value)} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Mistake made
            <textarea className={field} rows={2} value={values.mistake} onChange={(e) => set("mistake", e.target.value)} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Lesson learned
            <textarea className={field} rows={2} value={values.lesson} onChange={(e) => set("lesson", e.target.value)} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Additional notes
            <textarea className={field} rows={3} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-2 text-base font-semibold text-white">Screenshots</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Snip &amp; Sketch (or any screenshot), then press <kbd className="rounded bg-raised px-1.5 py-0.5 text-zinc-300">Ctrl</kbd>+
          <kbd className="rounded bg-raised px-1.5 py-0.5 text-zinc-300">V</kbd> on this page. You can also drop a file below.
        </p>
        <div
          ref={pasteHintRef}
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
            if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
          }}
          className="cursor-pointer rounded-xl border border-dashed border-line bg-bg px-4 py-6 text-center text-sm text-zinc-400 outline-none focus:border-profit"
          onClick={() => fileInputRef.current?.click()}
        >
          Click to choose files, or paste with Ctrl+V
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              const chosen = Array.from(e.target.files ?? []);
              if (chosen.length) setFiles((prev) => [...prev, ...chosen]);
              e.target.value = "";
            }}
          />
        </div>
        {previews.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {previews.map((src, index) => (
              <div key={src} className="relative">
                <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 rounded-full bg-raised px-1.5 text-xs text-zinc-300"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <button type="submit" disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-60">
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
