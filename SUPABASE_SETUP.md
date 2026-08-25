# Supabase ulanishi — sozlash holati

Loyiha Supabase PostgreSQL bazasiga ulandi.

## Supabase loyiha
- Project ref: `uetkhdtgcuwovvddwfyw`
- Region: Northeast Asia (Seoul) · ap-northeast-2
- URL: https://uetkhdtgcuwovvddwfyw.supabase.co

## Bajarilgan ishlar
1. `.env` — `DATABASE_URL` (Transaction pooler, 6543) va `DIRECT_URL` (Session pooler, 5432) qo'shildi. `NEXTAUTH_SECRET` yangilandi.
2. `prisma.config.ts` — migratsiya uchun `DIRECT_URL` ishlatadigan qilib sozlandi.
3. Schema Supabase'ga ko'chirildi (9 ta jadval): User, Course, TimeSlot, Lead, Reminder, Activity, Tag, Setting, `_LeadToTag`. SQL fayl: `supabase/init.sql`.
4. Boshlang'ich ma'lumotlar yozildi: 4 foydalanuvchi, 5 kurs, 8 vaqt sloti, 10 teg, 10 namuna lid, 2 sozlama.

## Holat: TO'LIQ ISHLAYAPTI ✅
- Baza paroli reset qilindi va `.env` ga yozildi (`DATABASE_URL` va `DIRECT_URL`).
- Ulanish tekshirildi: ikkala ulanish ham OK.
- `admin` bilan kirish sinovdan o'tdi — dashboard Supabase'dagi jonli ma'lumotni ko'rsatdi.

## Serverni ishga tushirish
`start-dev.bat` faylini ikki marta bosing (yoki terminalda `npm run dev`),
so'ng brauzerda http://localhost:3000 ni oching.

## Kirish ma'lumotlari (login)
| Username   | Parol          | Rol         |
|------------|----------------|-------------|
| admin      | Admin123!@#    | SUPER_ADMIN |
| manager1   | Manager123!    | MANAGER     |
| operator1  | Operator123!   | OPERATOR    |
| operator2  | Operator123!   | OPERATOR    |

> Birinchi kirishdan keyin admin parolini o'zgartiring.
