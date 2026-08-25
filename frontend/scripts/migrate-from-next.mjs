// Next.js (TSX) manbasini Vite + React (JSX) ga ko'chiruvchi bir martalik skript.
//
// Ikki bosqich:
//   1. TypeScript compiler `transpileModule` bilan tiplarni olib tashlaydi
//      (jsx: preserve — JSX o'z holicha qoladi).
//   2. Next'ga xos importlarni frontend'dagi mos qatlamlarga almashtiradi.
//
// Ishlatish:  node scripts/migrate-from-next.mjs
// Qayta ishga tushirish xavfsiz: chiqish fayllari qayta yoziladi.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(HERE, "..");
const REPO_ROOT = path.resolve(FRONTEND, "..");
const NEXT_SRC = path.join(REPO_ROOT, "src");
const OUT_SRC = path.join(FRONTEND, "src");

// Ildizdagi Next ilovasi bilan kelgan TypeScript 5. (TS 7 — native port —
// `transpileModule`ni JS API sifatida bermaydi, shuning uchun aynan shu nusxa.)
const ts = createRequire(import.meta.url)(path.join(REPO_ROOT, "node_modules", "typescript"));

// ---------------------------------------------------------------- transpile

function transpile(source, fileName) {
  const out = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      removeComments: false,
      isolatedModules: true,
    },
  });
  return out.outputText;
}

// ---------------------------------------------------------------- rewrites

function rewrite(code) {
  let out = code;

  // "use client" — Vite'da hammasi mijoz tomonida ishlaydi.
  out = out.replace(/^\s*["']use client["'];?\r?\n/m, "");

  // Prisma'dan kelgan enum importlari faqat tip sifatida ishlatilgan; transpile
  // ularni olib tashlamasa ham, brauzerda Prisma client yo'q — o'chiramiz.
  out = out.replace(/^import\s+(?:type\s+)?\{[^}]*\}\s+from\s+["']@\/generated\/[^"']+["'];?\r?\n/gm, "");

  // next/link -> href propini qabul qiladigan o'ram
  out = out.replace(/^import\s+Link\s+from\s+["']next\/link["'];?/gm, 'import Link from "@/components/ui/link";');

  // next/navigation -> react-router ustidagi qatlam
  out = out.replace(/from\s+["']next\/navigation["']/g, 'from "@/lib/router"');

  // next-auth/react -> AuthContext ustidagi qatlam
  out = out.replace(/from\s+["']next-auth\/react["']/g, 'from "@/lib/session"');

  // fetch("/api/...") / fetch(`/api/...`) / fetch(url, ...) -> apiFetch
  const usedFetch = /\bfetch\(\s*(["'`]\/api|url\b)/.test(out);
  out = out.replace(/\bfetch\(\s*(["'`]\/api)/g, "apiFetch($1");
  out = out.replace(/\bfetch\(\s*url\b/g, "apiFetch(url");

  // <img src="/api/branding/logo"> — backend boshqa origin'da, to'liq manzil kerak
  const usedLogo = out.includes('"/api/branding/logo"');
  out = out.replace(/["']\/api\/branding\/logo["']/g, "LOGO_URL");

  const needed = [];
  if (usedFetch) needed.push("apiFetch");
  if (usedLogo) needed.push("LOGO_URL");
  if (needed.length) out = addImport(out, `import { ${needed.join(", ")} } from "@/lib/api";`);

  return out;
}

// Importni oxirgi mavjud import satridan keyin qo'shadi (fayl boshidagi
// izohlardan keyin qolishi uchun).
function addImport(code, statement) {
  const lines = code.split("\n");
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s.+from\s+["'].+["'];?\s*$/.test(lines[i]) || /^import\s+["'].+["'];?\s*$/.test(lines[i])) {
      last = i;
    }
  }
  lines.splice(last + 1, 0, statement);
  return lines.join("\n");
}

// ---------------------------------------------------------------- nomlash

const PAGE_NAME_OVERRIDES = {
  "(dashboard)/dashboard": "DashboardPage",
  "(dashboard)/leads/[id]": "LeadDetailPage",
  "(dashboard)/students/[id]": "StudentDetailPage",
  "teacher/groups/[id]": "TeacherGroupPage",
  "teacher/students/[id]": "TeacherStudentPage",
  "receipt/[id]": "ReceiptPage",
  "miniapp/profil": "MiniappProfilePage",
  "not-found": "NotFoundPage",
};

function pascal(segment) {
  return segment
    .replace(/[[\]()]/g, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

// "(dashboard)/leads/kanban" -> "LeadsKanbanPage"
function pageComponentName(routePath) {
  if (PAGE_NAME_OVERRIDES[routePath]) return PAGE_NAME_OVERRIDES[routePath];
  const segments = routePath
    .split("/")
    .filter((s) => s && !/^\(.+\)$/.test(s))
    .map((s) => (/^\[.+\]$/.test(s) ? "Detail" : pascal(s)));
  return `${segments.join("")}Page`;
}

// ---------------------------------------------------------------- ko'chirish

// Qo'lda yoziladigan yoki Vite'da keraksiz bo'lgan fayllar.
const SKIP = new Set([
  "layout.tsx", // route layout'lar -> src/layouts/*.jsx
  "loading.tsx", // Next Suspense konvensiyasi
  "error.tsx",
  "manifest.ts",
  "robots.ts",
  "sitemap.ts",
]);

const SKIP_ROUTES = new Set([
  "(auth)/login", // qo'lda: AuthContext'ga ulangan
  "", // src/app/page.tsx — SSR landing, qo'lda
]);

const copied = [];

function copyFile(srcFile, destFile) {
  const source = fs.readFileSync(srcFile, "utf8");
  const code = rewrite(transpile(source, srcFile));
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, code);
  copied.push(path.relative(FRONTEND, destFile).replace(/\\/g, "/"));
}

function jsExt(file) {
  return file.endsWith(".tsx") ? ".jsx" : ".js";
}

// 1. components/** — yo'llar bir xil qoladi, "@/components/..." ishlayveradi
function copyComponents() {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      const rel = path.relative(path.join(NEXT_SRC, "components"), full);
      const dest = path.join(OUT_SRC, "components", rel.replace(/\.tsx?$/, jsExt(entry.name)));
      copyFile(full, dest);
    }
  };
  walk(path.join(NEXT_SRC, "components"));
}

// 2. lib + hooks — faqat brauzerda kerak bo'lganlari (db, auth, sms va h.k. backendda)
const LIB_FILES = ["utils.ts", "constants.ts", "permissions.ts", "export.ts", "permission-catalog.ts"];

function copyLib() {
  for (const file of LIB_FILES) {
    copyFile(path.join(NEXT_SRC, "lib", file), path.join(OUT_SRC, "lib", file.replace(/\.ts$/, ".js")));
  }
  copyFile(path.join(NEXT_SRC, "hooks", "useDarkMode.ts"), path.join(OUT_SRC, "hooks", "useDarkMode.js"));
}

// 3. src/app/**/page.tsx -> src/pages/<Nom>Page.jsx (yassi tuzilma: yonidagi
//    komponentlar ham shu yerga tushadi, shuning uchun "./AttendanceTab" kabi
//    nisbiy importlar ishlayveradi)
function copyPages() {
  const appDir = path.join(NEXT_SRC, "app");

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(appDir, full).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (rel === "api") continue; // backendga ko'chirilgan
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (SKIP.has(entry.name)) continue;

      const routePath = path.dirname(rel) === "." ? "" : path.dirname(rel);

      if (entry.name === "page.tsx") {
        if (SKIP_ROUTES.has(routePath)) continue;
        const name = pageComponentName(routePath);
        copyFile(full, path.join(OUT_SRC, "pages", `${name}.jsx`));
      } else if (entry.name === "not-found.tsx") {
        copyFile(full, path.join(OUT_SRC, "pages", "NotFoundPage.jsx"));
      } else {
        // sahifa yonidagi yordamchi komponent (DashboardCharts, AttendanceTab, ...)
        copyFile(full, path.join(OUT_SRC, "pages", entry.name.replace(/\.tsx?$/, jsExt(entry.name))));
      }
    }
  };

  walk(appDir);
}

copyComponents();
copyLib();
copyPages();

console.log(`${copied.length} ta fayl ko'chirildi:`);
for (const file of copied.sort()) console.log("  " + file);
