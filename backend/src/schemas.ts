import { z, type ZodError } from "zod";

const FIELD_LABELS: Record<string, string> = {
  accountId: "Account",
  symbol: "Symbol",
  direction: "Direction",
  quantity: "Quantity / lot size",
  entryPrice: "Entry price",
  exitPrice: "Exit price",
  stopLoss: "Stop loss",
  openedAt: "Open date and time",
  profitLoss: "Profit or loss",
  currency: "Currency",
};

function normalizeDecimal(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : value;
  }
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  return trimmed.replace(/[$€£₹¥]/g, "").replace(/\s/g, "").replace(/,/g, "");
}

const decimalString = z.preprocess(
  normalizeDecimal,
  z
    .string({ required_error: "is required", invalid_type_error: "must be a number" })
    .refine((v) => v !== "" && Number.isFinite(Number(v)), "must be a number")
);

const optionalDecimal = z.preprocess(
  normalizeDecimal,
  z
    .string()
    .refine((v) => Number.isFinite(Number(v)), "must be a number")
    .optional()
);

const optionalText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    return t === "" ? undefined : t;
  });

export const tradeBodySchema = z
  .object({
    accountId: z.string().min(1, "is required"),
    symbol: z.string().trim().min(1).max(64),
    direction: z.enum(["BUY", "SELL"]),
    quantity: decimalString,
    entryPrice: decimalString,
    exitPrice: optionalDecimal,
    stopLoss: optionalDecimal,
    openedAt: z.string().min(1),
    profitLoss: optionalDecimal,
    currency: z.string().trim().min(1).max(8).optional(),
    strategy: optionalText.optional(),
    entryReason: optionalText.optional(),
    followedPlan: z
      .union([z.boolean(), z.literal("true"), z.literal("false"), z.null(), z.undefined()])
      .optional()
      .transform((v) => {
        if (v === true || v === "true") return true;
        if (v === false || v === "false") return false;
        return undefined;
      }),
    emotionalState: optionalText.optional(),
    mistake: optionalText.optional(),
    lesson: optionalText.optional(),
    notes: optionalText.optional(),
  })
  .superRefine((data, ctx) => {
    const opened = new Date(data.openedAt);
    if (Number.isNaN(opened.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid open date", path: ["openedAt"] });
    }
    const isClosed = Boolean(data.profitLoss !== undefined || data.exitPrice);
    if (isClosed) {
      if (!data.exitPrice) {
        ctx.addIssue({ code: "custom", message: "Exit price is required for a closed trade", path: ["exitPrice"] });
      }
      if (data.profitLoss === undefined) {
        ctx.addIssue({ code: "custom", message: "Profit/loss is required for a closed trade", path: ["profitLoss"] });
      }
    }
  });

export type TradeBody = z.infer<typeof tradeBodySchema>;

export function formatTradeError(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Invalid trade";
  const key = String(issue.path[0] ?? "");
  const label = FIELD_LABELS[key];
  const msg = issue.message;
  if (msg === "must be a number" && label) {
    return `${label} must be a number (example: 1.5)`;
  }
  if ((msg === "is required" || msg === "Required") && label) {
    return `${label} is required`;
  }
  if (msg.includes("closed trade")) return msg;
  if (label) return `${label}: ${msg}`;
  return msg;
}

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const accountBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  broker: optionalText.optional(),
  startingBalance: decimalString,
  currency: z.string().trim().min(1).max(8).optional(),
});

export const accountPatchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  broker: optionalText.optional(),
  startingBalance: optionalDecimal,
  currency: z.string().trim().min(1).max(8).optional(),
  archived: z.boolean().optional(),
});
