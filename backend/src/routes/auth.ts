import type { Request, Response, NextFunction } from "express";
import { loginSchema } from "../schemas";
import { signToken } from "../auth";

export function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: "APP_PASSWORD is not configured" });
    return;
  }

  if (parsed.data.password !== expected) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.json({ token: signToken() });
}

export function meHandler(_req: Request, res: Response) {
  res.json({ ok: true });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
}
