import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthPayload = { sub: "journal" };

export function signToken() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign({ sub: "journal" } satisfies AuthPayload, secret, {
    expiresIn: "30d",
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
