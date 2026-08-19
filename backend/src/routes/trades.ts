import { Router } from "express";
import multer from "multer";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { tradeBodySchema, formatTradeError } from "../schemas";
import { serializeImage, serializeTrade, toPrismaData } from "../serialize";
import { cloudinary, isCloudinaryConfigured } from "../cloudinary";
import { asyncHandler } from "./auth";
import { accountFilter, parseQueryString } from "../accountFilter";

export const tradesRouter = Router();

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

function parseOutcome(outcome: unknown): Prisma.DecimalFilter | undefined {
  if (outcome === "win") return { gt: 0 };
  if (outcome === "loss") return { lt: 0 };
  if (outcome === "be") return { equals: 0 };
  return undefined;
}

tradesRouter.get("/trades", asyncHandler(async (req, res) => {
  const from = parseQueryString(req.query.from);
  const to = parseQueryString(req.query.to);
  const symbol = parseQueryString(req.query.symbol)?.trim();
  const directionRaw = parseQueryString(req.query.direction);
  const direction = directionRaw === "BUY" || directionRaw === "SELL" ? directionRaw : undefined;
  const strategy = parseQueryString(req.query.strategy)?.trim();
  const outcome = parseQueryString(req.query.outcome);
  const accountId = parseQueryString(req.query.accountId);

  const where: Prisma.TradeWhereInput = {
    ...accountFilter(accountId),
  };

  if (from || to) {
    where.openedAt = {};
    if (from) where.openedAt.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        end.setUTCHours(23, 59, 59, 999);
      }
      where.openedAt.lte = end;
    }
  }

  if (symbol) {
    where.symbol = { contains: symbol.toUpperCase(), mode: "insensitive" };
  }
  if (direction) where.direction = direction;
  if (strategy) {
    where.strategy = { equals: strategy, mode: "insensitive" };
  }

  const plFilter = parseOutcome(outcome);
  if (plFilter) {
    where.profitLoss = plFilter;
  }

  const trades = await prisma.trade.findMany({
    where,
    orderBy: { openedAt: "desc" },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });

  res.json(trades.map(serializeTrade));
}));

tradesRouter.get("/trades/:id", asyncHandler(async (req, res) => {
  const trade = await prisma.trade.findUnique({
    where: { id: req.params.id },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });
  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }
  res.json(serializeTrade(trade));
}));

tradesRouter.post("/trades", asyncHandler(async (req, res) => {
  const parsed = tradeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatTradeError(parsed.error) });
    return;
  }
  const account = await prisma.account.findUnique({ where: { id: parsed.data.accountId } });
  if (!account) {
    res.status(400).json({ error: "Account is required" });
    return;
  }
  const trade = await prisma.trade.create({
    data: toPrismaData(parsed.data),
    include: { images: true },
  });
  res.status(201).json(serializeTrade(trade));
}));

tradesRouter.put("/trades/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.trade.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }
  const parsed = tradeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatTradeError(parsed.error) });
    return;
  }
  const account = await prisma.account.findUnique({ where: { id: parsed.data.accountId } });
  if (!account) {
    res.status(400).json({ error: "Account is required" });
    return;
  }
  const trade = await prisma.trade.update({
    where: { id: req.params.id },
    data: toPrismaData(parsed.data),
    include: { images: { orderBy: { createdAt: "asc" } } },
  });
  res.json(serializeTrade(trade));
}));

async function destroyCloudinary(publicId: string) {
  if (!isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId);
}

tradesRouter.delete("/trades/:id", asyncHandler(async (req, res) => {
  const trade = await prisma.trade.findUnique({
    where: { id: req.params.id },
    include: { images: true },
  });
  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }
  await Promise.all(trade.images.map((img) => destroyCloudinary(img.cloudinaryPublicId)));
  await prisma.trade.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));

function uploadBuffer(buffer: Buffer, options: { folder: string; filename: string }) {
  return new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "image",
        original_filename: options.filename,
      },
      (err, result) => {
        if (err || !result) {
          reject(err ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ public_id: result.public_id, secure_url: result.secure_url });
      }
    );
    stream.end(buffer);
  });
}

tradesRouter.post("/trades/:id/images", (req, res) => {
  upload.array("images", 8)(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!isCloudinaryConfigured()) {
      res.status(500).json({ error: "Cloudinary is not configured" });
      return;
    }
    const trade = await prisma.trade.findUnique({ where: { id: req.params.id } });
    if (!trade) {
      res.status(404).json({ error: "Trade not found" });
      return;
    }
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      res.status(400).json({ error: "No images uploaded" });
      return;
    }

    try {
      const created = [];
      for (const file of files) {
        const uploaded = await uploadBuffer(file.buffer, {
          folder: `trading-journal/${trade.id}`,
          filename: file.originalname,
        });
        const row = await prisma.tradeImage.create({
          data: {
            tradeId: trade.id,
            fileName: file.originalname,
            cloudinaryPublicId: uploaded.public_id,
            secureUrl: uploaded.secure_url,
            mimeType: file.mimetype,
            sizeBytes: file.size,
          },
        });
        created.push(serializeImage(row));
      }
      res.status(201).json(created);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      res.status(500).json({ error: message });
    }
  });
});

tradesRouter.delete("/trades/:id/images/:imageId", asyncHandler(async (req, res) => {
  const image = await prisma.tradeImage.findFirst({
    where: { id: req.params.imageId, tradeId: req.params.id },
  });
  if (!image) {
    res.status(404).json({ error: "Image not found" });
    return;
  }
  await destroyCloudinary(image.cloudinaryPublicId);
  await prisma.tradeImage.delete({ where: { id: image.id } });
  res.status(204).end();
}));
