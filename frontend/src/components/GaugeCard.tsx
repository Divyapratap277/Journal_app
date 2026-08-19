import { formatMoney } from "../format";

type Props = {
  title: string;
  variant: "direction" | "profitability";
  centerValue: string;
  centerValueClass?: string;
  winRate: number;
  wins: number;
  winAmount: number;
  losses: number;
  lossAmount: number;
  currency?: string;
  lossRate?: number;
};

export function GaugeCard({
  title,
  variant,
  centerValue,
  centerValueClass,
  winRate,
  wins,
  winAmount,
  losses,
  lossAmount,
  currency = "USD",
  lossRate,
}: Props) {
  const winPct = Math.min(100, Math.max(0, winRate));
  const circ = Math.PI * 54;

  return (
    <div className="lift rounded-xl border border-line bg-surface p-5">
      <h3 className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">{title}</h3>
      <div className="relative mx-auto mt-1 h-36 w-56">
        <svg viewBox="0 0 140 80" className="h-full w-full">
          <path d="M 16 70 A 54 54 0 0 1 124 70" fill="none" stroke="#2a2d38" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M 16 70 A 54 54 0 0 1 124 70"
            fill="none"
            stroke="#e74c3c"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
          />
          <path
            d="M 16 70 A 54 54 0 0 1 124 70"
            fill="none"
            stroke="#2ecc71"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(winPct / 100) * circ} ${circ}`}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500">
            {variant === "profitability" ? "Total Trades" : "Profit"}
          </div>
          <div className={`tabular text-xl font-semibold ${centerValueClass ?? "text-white"}`}>{centerValue}</div>
        </div>
      </div>
      {variant === "direction" ? (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-medium text-profit">Wins ({wins})</div>
            <div className="tabular mt-0.5 text-zinc-400">{formatMoney(winAmount, currency)}</div>
          </div>
          <div>
            <div className="text-zinc-400">Win Rate</div>
            <div className="tabular mt-0.5 font-semibold">{winRate.toFixed(0)}%</div>
          </div>
          <div>
            <div className="font-medium text-loss">Losses ({losses})</div>
            <div className="tabular mt-0.5 text-zinc-400">{formatMoney(lossAmount, currency)}</div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs">
          <div>
            <div className="tabular text-lg font-semibold text-profit">{winRate.toFixed(0)}%</div>
            <div className="mt-0.5 text-zinc-400">Wins: {wins}</div>
          </div>
          <div>
            <div className="tabular text-lg font-semibold text-loss">{(lossRate ?? 0).toFixed(0)}%</div>
            <div className="mt-0.5 text-zinc-400">Losses: {losses}</div>
          </div>
        </div>
      )}
    </div>
  );
}
