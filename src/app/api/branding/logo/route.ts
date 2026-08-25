import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Fallback used when no logo has been uploaded in Sozlamalar yet.
const DEFAULT_LOGO_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="120" fill="#5E2CA5"/></svg>`;

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

// Public endpoint: serves the branding logo as raw image bytes (favicon, PWA icons, sidebar, login).
export async function GET() {
  try {
    const setting = await db.setting.findUnique({ where: { key: "brand_logo" } });
    const parsed = setting?.value ? parseDataUrl(setting.value) : null;
    if (parsed) {
      return new NextResponse(new Uint8Array(parsed.buffer), {
        headers: {
          "Content-Type": parsed.mime,
          "Cache-Control": "public, max-age=300, must-revalidate",
        },
      });
    }
  } catch {
    // fall through to default logo below
  }
  return new NextResponse(DEFAULT_LOGO_SVG, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, must-revalidate",
    },
  });
}
