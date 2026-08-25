// Public endpoints (no auth): brand name/logo for login page, sidebar, favicon, PWA icons.
import { Router } from "express";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";

const router = Router();

// Fallback used when no logo has been uploaded in Sozlamalar yet.
const DEFAULT_LOGO_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="120" fill="#5E2CA5"/></svg>`;

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

// GET /api/branding — logo + name as JSON
router.get("/", ah(async (req, res) => {
  try {
    const settings = await db.setting.findMany({
      where: { key: { in: ["brand_logo", "center_name"] } },
    });
    const map = {};
    for (const s of settings) map[s.key] = s.value;
    res.json({
      logo: map["brand_logo"] || "",
      name: map["center_name"] || "Robocode CRM",
    });
  } catch {
    res.json({ logo: "", name: "Robocode CRM" });
  }
}));

// GET /api/branding/logo — raw image bytes
router.get("/logo", ah(async (req, res) => {
  try {
    const setting = await db.setting.findUnique({ where: { key: "brand_logo" } });
    const parsed = setting?.value ? parseDataUrl(setting.value) : null;
    if (parsed) {
      res.setHeader("Content-Type", parsed.mime);
      res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
      return res.send(parsed.buffer);
    }
  } catch {
    // fall through to default logo below
  }
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
  res.send(DEFAULT_LOGO_SVG);
}));

export default router;
