import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { PERMISSION_CATALOG } from "../lib/permission-catalog.js";

const router = Router();
const adminOnly = requireRole("SUPER_ADMIN", "ADMIN");

const patchSchema = z.object({
  grants: z.array(z.object({
    module: z.string(),
    action: z.string(),
    granted: z.boolean(),
  })),
});

// GET /api/permissions/users/:userId
router.get("/users/:userId", adminOnly, ah(async (req, res) => {
  const { userId } = req.params;
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true, role: true } });
  if (!user) return res.status(404).json({ error: "Not found" });

  const grants = await db.userPermission.findMany({
    where: { userId, granted: true },
    select: { permission: { select: { module: true, action: true } } },
  });
  const grantedSet = new Set(grants.map((g) => `${g.permission.module}:${g.permission.action}`));

  res.json({
    user,
    catalog: PERMISSION_CATALOG,
    granted: PERMISSION_CATALOG
      .filter((p) => grantedSet.has(`${p.module}:${p.action}`))
      .map((p) => `${p.module}:${p.action}`),
  });
}));

// PATCH /api/permissions/users/:userId
router.patch("/users/:userId", adminOnly, ah(async (req, res) => {
  const { userId } = req.params;
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return res.status(404).json({ error: "Not found" });

  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let updated = 0;
  for (const g of parsed.data.grants) {
    const permission = await db.permission.findUnique({ where: { module_action: { module: g.module, action: g.action } } });
    if (!permission) continue;
    await db.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: { granted: g.granted },
      create: { userId, permissionId: permission.id, granted: g.granted },
    });
    updated++;
  }

  res.json({ success: true, updated });
}));

export default router;
