// Single-endpoint modules that don't warrant a file each: audit log + coin leaderboard.
import { Router } from "express";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";

export const logsRouter = Router();

// GET /api/logs
logsRouter.get("/", requireRole("SUPER_ADMIN", "ADMIN"), ah(async (req, res) => {
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  res.json(logs);
}));

export const leaderboardRouter = Router();

// GET /api/leaderboard
leaderboardRouter.get("/", ah(async (req, res) => {
  const leads = await db.lead.findMany({
    where: { coins: { gt: 0 } },
    orderBy: { coins: "desc" },
    take: 100,
    select: { id: true, fullName: true, coins: true, group: { select: { name: true } } },
  });
  res.json(leads);
}));
