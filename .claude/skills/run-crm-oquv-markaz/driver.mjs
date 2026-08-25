// Playwright smoke driver for crm-oquv-markaz (Robocode CRM).
// Launches headless Chromium, logs in as the seeded admin user, navigates
// to a page, and screenshots it. One-shot process (launch -> act -> close),
// not a persistent REPL: there is no long-lived app process to attach to
// between commands like there would be for Electron.
//
// Usage:
//   node .claude/skills/run-crm-oquv-markaz/driver.mjs <path> <screenshot.png>
//
// Examples:
//   node .claude/skills/run-crm-oquv-markaz/driver.mjs /dashboard shots/dashboard.png
//   node .claude/skills/run-crm-oquv-markaz/driver.mjs /leads shots/leads.png

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_USER = process.env.CRM_USER || "admin";
const ADMIN_PASS = process.env.CRM_PASS || "Admin123!@#";

const [targetPath = "/dashboard", outPath = "screenshot.png"] = process.argv.slice(2);

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill('input[autocomplete="username"]', ADMIN_USER);
  await page.fill('input[autocomplete="current-password"]', ADMIN_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });

  if (targetPath !== "/dashboard") {
    await page.goto(`${BASE_URL}${targetPath}`, { waitUntil: "networkidle" });
  }
  // Dashboard stat cards and charts fetch client-side after networkidle
  // fires; give them a beat to paint before the screenshot.
  await page.waitForTimeout(1500);

  mkdirSync(dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath, fullPage: true });

  console.log("url:", page.url());
  console.log("screenshot:", outPath);
  console.log("console errors:", consoleErrors.length ? consoleErrors : "none");

  await browser.close();
  if (consoleErrors.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
