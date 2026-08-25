import { Router } from "express";
import { ah, requireRole } from "../lib/http.js";
import { sendSms } from "../lib/sms.js";

const router = Router();

// POST /api/sms/test
router.post("/test", requireRole("SUPER_ADMIN", "ADMIN"), ah(async (req, res) => {
  const { phone, text } = req.body;
  if (!phone || !text) return res.status(400).json({ error: "Telefon va matn kerak" });

  const r = await sendSms(phone, text);
  if (!r.ok) return res.status(400).json({ error: r.error });
  res.json({ success: true });
}));

export default router;
