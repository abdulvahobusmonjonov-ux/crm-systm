# Loyiha strukturasi

Bu hujjat Robocode CRM (Next.js App Router) loyihasidagi backend/frontend chegarasini
tavsiflaydi. Hech qanday runtime mantiq o'zgartirilmagan — bu faqat fayllarning qayerda
joylashgani va nima uchun ekanini tushuntiruvchi xarita.

## BACKEND

Server tomonida ishlaydigan, brauzerga hech qachon yuborilmaydigan kod:

- `src/app/api/**` — barcha Route Handler'lar (REST API endpointlar: `route.ts`).
- `src/lib/**` — server-only kutubxona: DB client, auth, ruxsatlar, tashqi integratsiyalar.
  - `db.ts` — Prisma client singleton.
  - `auth.ts`, `auth.config.ts` — NextAuth konfiguratsiyasi va sessiya callbacklari.
  - `rbac.ts`, `permissions.ts`, `permission-catalog.ts` — rol/ruxsat tekshiruvlari.
  - `audit.ts`, `debtors.ts`, `export.ts`, `sms.ts`, `teacher.ts`, `telegram-auth.ts` —
    domenga oid server logikasi.
  - `constants.ts`, `utils.ts` — umumiy yordamchi funksiyalar (server va client ikkalasida
    ham xavfsiz ishlatiladi, lekin joylashuvi bo'yicha shu paketga tegishli).
- `prisma/**` — ma'lumotlar bazasi sxemasi (`schema.prisma`) va migratsiyalar.

`src/lib` ichida hech qanday `"use client"` fayl yo'q — demak u allaqachon toza server
qatlami, frontend komponentlari bilan aralashmagan.

## FRONTEND

Brauzerda render bo'ladigan sahifalar va UI komponentlari:

- `src/app/(auth)`, `src/app/(dashboard)`, `src/app/teacher`, `src/app/student`,
  `src/app/reception`, `src/app/finance`, `src/app/miniapp`, `src/app/apply`,
  `src/app/receipt` — sahifalar (`page.tsx`, `layout.tsx`) va ularning route-darajasidagi
  konfiguratsiyasi. Bu yerdagi server-komponent sahifalar `src/lib` dan auth/db chaqiradi,
  lekin o'zi UI qatlamiga tegishli.
- `src/components/**` — qayta ishlatiluvchi UI komponentlari (quyida batafsil).
- `src/hooks/**` — client-side React hook'lar (masalan, `useDarkMode`).

### `src/components/` ichki tuzilishi

| Papka | Vazifasi |
|---|---|
| `landing/` | Ochiq (login talab qilmaydigan) marketing sahifasi komponentlari. |
| `dashboard/` | Faqat `(dashboard)` route-guruhida ishlatiladigan admin panel qobig'i: `DashboardShell`, `Sidebar`, `Topbar`, `CommandPalette`, `NotificationBell`, `UserFormModal`. |
| `teacher/` | Faqat `/teacher/**` sahifalarida ishlatiladigan o'qituvchi paneli qobig'i: `TeacherShell`, `TeacherSidebar`, `TeacherTopbar`. |
| `student/` | Faqat `/student/**` sahifasida ishlatiladigan o'quvchi portali qobig'i: `StudentShell`. |
| `shared/` | Ikkitadan ortiq portal orasida haqiqatan umumiy bo'lgan komponentlar: `PortalShell`/`PortalSidebar`/`PortalTopbar` — `reception` va `finance` layoutlari tomonidan birgalikda ishlatiladi. |
| `ui/` | Domenga bog'liq bo'lmagan generik UI elementlari (button, input, modal, badge va h.k.). |

**Tuzatilgan chalkashlik:** avval `DashboardShell`/`Sidebar`/`Topbar`/`CommandPalette`/
`NotificationBell` `shared/` papkasida turardi, lekin ular faqat `(dashboard)` layout
tomonidan ishlatilar edi — haqiqiy "shared" emas edi. Ular endi `dashboard/` ga
ko'chirildi. `forms/UserFormModal.tsx` ham faqat `/users` sahifasida (dashboard)
ishlatilgani uchun `dashboard/` ga ko'chirildi. Avvalgi `portal/` papkasi esa haqiqatan
ham bir nechta portal (`reception` + `finance`) orasida umumiy bo'lgani uchun nomi
`shared/` ga o'zgartirildi.

## UMUMIY

- `src/generated/prisma` — Prisma client avtomatik generatsiya qiladigan kod (tip va
  runtime client). Backend (`src/lib/db.ts`, `src/lib/rbac.ts` va h.k.) uni to'g'ridan-to'g'ri
  ishlatadi; frontend esa undan faqat tip importlari (masalan, `Role` enum) uchun
  foydalanishi mumkin. Qo'lda tahrirlanmaydi — `prisma/schema.prisma` dan qayta hosil
  qilinadi.
