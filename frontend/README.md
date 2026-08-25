# frontend — Vite + React (JSX)

Next.js ilovasidan ko'chirilgan mijoz tomoni. Backend (`../backend`, port 4000)
bilan faqat REST orqali gaplashadi.

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm run dev            # http://localhost:5173
```

## Tuzilma

```
src/
├── main.jsx              BrowserRouter + AuthProvider + Toaster
├── App.jsx               barcha yo'llar jadvali
├── index.css             Next'dagi globals.css (Tailwind v4, binafsha dizayn)
├── context/AuthContext   sessiya: login / logout / token
├── routes/guards.jsx     RequireAuth, RequireRole
├── layouts/              Next'dagi route layout'lar o'rnida
├── pages/                sahifalar (src/app/**/page.tsx dan)
├── components/           landing, dashboard, teacher, student, shared, ui
├── hooks/, lib/          utils, constants, permissions, export
└── scripts/              migrate-from-next.mjs (bir martalik ko'chirish skripti)
```

## Next.js → Vite moslashtiruvchi qatlam

Ko'chirishda 190+ chaqiruvni qayta yozmaslik uchun uchta ingichka modul yozilgan.
Ular Next API'lari bilan bir xil imzoga ega, shuning uchun sahifalar kodi deyarli
tegilmagan:

| Next.js               | Bu yerda                                  |
| --------------------- | ----------------------------------------- |
| `fetch("/api/...")`   | `apiFetch()` — `@/lib/api` (baseURL + JWT) |
| `next/navigation`     | `@/lib/router` (react-router ustida)      |
| `next-auth/react`     | `@/lib/session` (AuthContext ustida)      |
| `next/link`           | `@/components/ui/link` (`href` propi bilan) |
| `next/dynamic`        | `React.lazy` + `<Suspense>`               |
| server layout + guard | `layouts/*` + `routes/guards.jsx`         |

`@/lib/api` ikki narsani beradi: `api` (axios instance) va `apiFetch` (nativ
`fetch` imzosidagi o'ram). Ikkalasi ham `VITE_API_URL` ni baseURL qilib oladi va
`localStorage`dagi tokenni `Authorization` header'ga qo'yadi; 401 kelganda
sessiyani tozalab `/login` ga qaytaradi.

## Manzillar

Manzillar Next.js versiyasidagi bilan bir xil qoldirilgan — `(dashboard)` route
group bo'lgani uchun uning sahifalari `/leads`, `/settings` kabi yuqori darajada
turadi (`App.jsx` da "pathless" layout route sifatida).

## Ko'chirish skripti

`scripts/migrate-from-next.mjs` — `../src` dagi TSX fayllarni tiplardan tozalab
(TypeScript `transpileModule`, `jsx: preserve`) shu yerga JSX qilib ko'chirgan va
yuqoridagi importlarni almashtirgan bir martalik skript. Tarix uchun saqlangan;
qayta ishga tushirilsa, qo'lda yozilgan fayllar (`App.jsx`, `main.jsx`,
`LoginPage.jsx`, `HomePage.jsx`, `layouts/*`) qayta yozilmaydi.
