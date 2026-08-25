import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public endpoint: returns brand logo + name for login/sidebar (no auth required).
export async function GET() {
  try {
    const settings = await db.setting.findMany({
      where: { key: { in: ["brand_logo", "center_name"] } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return NextResponse.json({
      logo: map["brand_logo"] || "",
      name: map["center_name"] || "Robocode CRM",
    });
  } catch {
    return NextResponse.json({ logo: "", name: "Robocode CRM" });
  }
}
