import express from "express";
import cors from "cors";
import { requireAuth } from "./auth";
import { configureCloudinary } from "./cloudinary";
import { loginHandler, meHandler } from "./routes/auth";
import { accountsRouter } from "./routes/accounts";
import { statsRouter } from "./routes/stats";
import { tradesRouter } from "./routes/trades";

configureCloudinary();

export const app = express();

const origins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/login", loginHandler);
app.get("/api/me", requireAuth, meHandler);
app.use("/api", requireAuth, accountsRouter);
app.use("/api", requireAuth, statsRouter);
app.use("/api", requireAuth, tradesRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : "Server error";
  res.status(500).json({ error: message });
});
