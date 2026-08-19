export type SymbolGroup = {
  category: string;
  options: { value: string; label: string }[];
};

export const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    category: "Forex",
    options: [
      { value: "EURUSD", label: "EURUSD" },
      { value: "GBPUSD", label: "GBPUSD" },
      { value: "USDJPY", label: "USDJPY" },
      { value: "USDCHF", label: "USDCHF" },
      { value: "AUDUSD", label: "AUDUSD" },
      { value: "USDCAD", label: "USDCAD" },
      { value: "NZDUSD", label: "NZDUSD" },
    ],
  },
  {
    category: "Crypto",
    options: [
      { value: "BTCUSD", label: "BTCUSD" },
      { value: "ETHUSD", label: "ETHUSD" },
    ],
  },
  {
    category: "Commodities",
    options: [
      { value: "XAUUSD", label: "XAUUSD - Gold" },
      { value: "XAGUSD", label: "XAGUSD - Silver" },
    ],
  },
];

export const ALL_SYMBOLS = SYMBOL_GROUPS.flatMap((g) => g.options.map((o) => o.value));
