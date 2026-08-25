# CRM O'quv Markaz

## Monorepo structure (`refactor/split`)

Bu repozitoriy alohida backend va frontend'ga bo'lingan. Jonli sayt hozircha
`master` branchdagi Next.js ilovasida ishlab turibdi — u tegilmagan.

```
.
├── backend/    Express API (port 4000)
├── frontend/   Vite + React SPA (port 5173)
└── ...         eski Next.js ilovasi (port 3000, o'zgarishsiz)
```

## Ishga tushirish

Ikkita terminal kerak: biri backend, ikkinchisi frontend. **Backend birinchi
ishga tushishi kerak** — frontend unga `http://localhost:4000` orqali ulanadi.

### 1. Backend — Express API, port `4000`

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL, JWT_SECRET, FRONTEND_ORIGIN to'ldiriladi
npm run dev            # yoki: npm start
```

`.env`:

| O'zgaruvchi       | Qiymat                                          |
| ----------------- | ----------------------------------------------- |
| `PORT`            | `4000`                                          |
| `DATABASE_URL`    | Postgres (Supabase) ulanish satri               |
| `JWT_SECRET`      | JWT imzolash kaliti                             |
| `FRONTEND_ORIGIN` | `http://localhost:5173` — CORS shu origin uchun |

Tekshirish: `curl http://localhost:4000/api/health` → `{"status":"ok"}`

### 2. Frontend — Vite + React, port `5173`

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm run dev            # http://localhost:5173
```

Boshqa buyruqlar: `npm run build` (dist/ ga yig'adi), `npm run preview`,
`npm run lint` (oxlint).

`VITE_API_URL` ko'rsatilmasa, `http://localhost:4000` standart qiymat sifatida
ishlatiladi (`src/lib/api.js`).

### Kirish (login) oqimi

1. `/login` sahifasi `POST /api/auth/login` ga `{ username, password }` yuboradi
   (username o'rniga telefon raqam ham bo'ladi).
2. Backend `{ token, user }` qaytaradi; token `localStorage`ga yoziladi.
3. Har bir keyingi so'rovga `Authorization: Bearer <token>` header qo'shiladi.
4. Himoyalangan sahifalar `RequireAuth` / `RequireRole` guard'lari ortida turadi;
   token bo'lmasa yoki 401 kelsa — `/login` ga qaytariladi.

---

## Legacy Next.js app (port 3000)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
