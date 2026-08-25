import { Router } from "express";
import { ah } from "../lib/http.js";
import { getDebtors } from "../lib/debtors.js";
import { hasPermission } from "../lib/rbac.js";

const router = Router();

// GET /api/debtors?month=YYYY-MM
router.get("/", ah(async (req, res) => {
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);
  if (!isAdminRole && !(await hasPermission(req.user, "debtors_archive", "debtors_access"))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const result = await getDebtors(req.query.month ? String(req.query.month) : null);
  res.json(result);
}));

export default router;
