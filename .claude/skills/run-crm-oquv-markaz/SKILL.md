---
name: run-crm-oquv-markaz
description: Build, run, and drive the Robocode CRM Next.js app. Use when asked to start the dev server, build it, take a screenshot of the UI, log in and check a page, or verify a change works in the running app.
---

This is a Next.js 16 (Turbopack) app backed by a real remote Supabase
Postgres database (connection string already in `.env`, not a local
Docker DB). It's driven with a small Playwright script — no
Claude-in-Chrome / chromium-cli available in this environment, so this
skill installs and uses Playwright directly:
`.claude/skills/run-crm-oquv-markaz/driver.mjs`.

All paths below are relative to the repo root.

## Prerequisites

Playwright + a Chromium binary (one-time, ~300MB):

```bash
npm install -D playwright
npx playwright install chromium
```

`node_modules/.bin` and `%LOCALAPPDATA%\ms-playwright` must exist before
`driver.mjs` will run. No OS packages needed — this runs on a normal
Windows desktop, not headless Linux, and Chrome for Testing works
out of the box.

## Setup

`.env` already has real `DATABASE_URL` / `DIRECT_URL` / `NEXTAUTH_SECRET`
values checked in locally (see `.gitignore` — `.env*` is not committed).
`npm install` runs `prisma generate` via `postinstall`.

```bash
npm install
```

Seeded users (from `prisma/seed.ts`, already applied to the remote DB —
`npm run db:seed` re-applies via upsert, it's not required to run the
app):

| username | password | role |
|---|---|---|
| `admin` | `Admin123!@#` | SUPER_ADMIN |
| `manager1` | `Manager123!` | MANAGER |
| `operator1` / `operator2` | `Operator123!` | OPERATOR |

## Build

```bash
npm run build   # prisma generate && next build
```

Verified: compiles cleanly, generates all ~58 routes (mostly dynamic
API routes + a handful of static pages).

## Run (agent path)

Start the dev server in the background, wait for it to serve, then
drive it with `driver.mjs`:

```bash
npm run dev &
echo $! > /tmp/dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

(On Windows Git Bash, prefix any driver invocation with
`MSYS_NO_PATHCONV=1` or the leading `/path` argument gets mangled into
a Windows path by MSYS.)

```bash
MSYS_NO_PATHCONV=1 node .claude/skills/run-crm-oquv-markaz/driver.mjs /dashboard .claude/skills/run-crm-oquv-markaz/shots/dashboard.png
```

`driver.mjs <path> <screenshot-out>` is one-shot: launches headless
Chromium, logs in as `admin` (override with `CRM_USER`/`CRM_PASS` env
vars), navigates to `<path>` (default `/dashboard`), screenshots it
full-page, prints any browser console errors, and exits non-zero if
there were any. There's no persistent REPL — each invocation is a
fresh browser, since there's no long-lived app process to attach to
(unlike Electron).

Screenshots land wherever you point the second argument; this repo's
`.gitignore` excludes `.claude/skills/run-crm-oquv-markaz/shots/` so
they don't get committed.

Stop the dev server with `kill $(cat /tmp/dev.pid)` before relaunching,
or the next run hits `EADDRINUSE`.

## Run (human path)

```bash
npm run dev   # → http://localhost:3000, Ctrl-C to stop
```

## Test

No test suite / `test` script exists in `package.json`. Verification
for this project is: `npm run build` (typecheck + compile) plus the
driver script (real login + real data render).

```bash
npm run lint
```

Verified: 0 errors, 48 pre-existing warnings (React hooks rules), exit 0.

---

## Gotchas

- **MSYS path mangling.** Running `node driver.mjs /dashboard ...` from
  Git Bash on Windows silently rewrites `/dashboard` into
  `C:/Program Files/Git/dashboard`, and Playwright fails with
  `Cannot navigate to invalid URL`. Prefix with `MSYS_NO_PATHCONV=1`.
- **Dashboard stat cards render blank right after login.** The
  `/dashboard` page's stat cards and the two chart panels fetch their
  data client-side; `waitUntil: "networkidle"` fires before that
  second fetch/render pass completes, so a screenshot taken
  immediately shows empty skeleton cards. `driver.mjs` adds a fixed
  1.5s `waitForTimeout` after navigation before screenshotting — that
  was enough to get real numbers in testing, but the two bottom chart
  panels can still be blank; if you need those specifically, wait
  longer or `waitForSelector` on a chart-specific element.
- **Login form has no `name`/`id` on its inputs** — `driver.mjs`
  targets them by `placeholder` (`"admin"` for username,
  `"••••••••"` for password). If the login page copy changes, update
  the selectors in `driver.mjs`.
- **`/` always 307-redirects** to `/login?callbackUrl=...` for
  unauthenticated requests — that's expected middleware behavior, not
  a broken route.

## Troubleshooting

- **`Cannot navigate to invalid URL` mentioning `C:/Program Files/Git/...`**:
  Git Bash MSYS path conversion mangled the URL-path argument. Re-run
  with `MSYS_NO_PATHCONV=1` prefixed.
- **`page.waitForURL` times out waiting for `/dashboard`**: credentials
  are wrong, or the remote Supabase DB is unreachable/paused. Confirm
  `admin` / `Admin123!@#` still works and that `DATABASE_URL` in `.env`
  points at a running project.
