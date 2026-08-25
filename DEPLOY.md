# Saytni internetga joylashtirish (Deploy) — qadamlar

Maqsad: saytni Vercel'ga joylashtirib, `.uz` domen ulash. Shunda hodimlar
istalgan joydan kirib ishlaydi, kompyuteringiz o'chiq bo'lsa ham sayt ishlaydi.

Kod tayyor: type-tekshiruvdan o'tdi, Prisma build sozlandi, cron sozlangan.

---

## 1-qadam: GitHub'ga kod yuklash (bepul)
Kompyuteringizda **GitHub Desktop** o'rnatilgan.
1. github.com da bepul akkaunt oching (agar yo'q bo'lsa).
2. GitHub Desktop'ni oching → **Sign in**.
3. **File → Add local repository** → loyiha papkasini tanlang
   (`Desktop/crm-oquv-markaz`).
4. **Publish repository** → nomi `crm-oquv-markaz`, **Private** (maxfiy) qilib
   chop eting.

> `.env` fayli avtomatik yuklanmaydi (gitignore'da) — maxfiy parollar
> GitHub'ga ketmaydi. Bu to'g'ri.

## 2-qadam: Vercel'ga joylashtirish (bepul)
1. vercel.com da **GitHub bilan** bepul ro'yxatdan o'ting.
2. **Add New → Project** → `crm-oquv-markaz` repozitoriysini tanlang → **Import**.
3. **Environment Variables** bo'limiga quyidagilarni qo'shing
   (qiymatlarni `.env` faylingizdan nusxa oling):

   | Nomi | Qiymat |
   |------|--------|
   | `DATABASE_URL` | `.env` dan (pooler 6543) |
   | `DIRECT_URL` | `.env` dan (pooler 5432) |
   | `NEXTAUTH_SECRET` | `.env` dan |
   | `NEXTAUTH_URL` | sayt manzili (masalan `https://crm-markazim.uz`) |
   | `NEXT_PUBLIC_APP_URL` | sayt manzili |
   | `NEXT_PUBLIC_APP_NAME` | `IT O'quv Markaz CRM` |
   | `CRON_SECRET` | istalgan tasodifiy matn (eslatma cron'i uchun) |

4. **Deploy** ni bosing. 1-2 daqiqada sayt tayyor bo'ladi:
   `crm-oquv-markaz.vercel.app`.

## 3-qadam: `.uz` domen ulash
1. `.uz` domenni akkreditatsiyalangan registrator orqali sotib oling
   (masalan: **ahost.uz**, **uz.uz / cctld.uz** ro'yxatidagi registratorlar).
   Domenga nom tanlang, to'lovni amalga oshiring.
2. Vercel'da: **Project → Settings → Domains** → domeningizni qo'shing.
3. Vercel ko'rsatgan DNS yozuvlarini (A yoki CNAME) registrator panelida
   domeningizga qo'shing.
4. 10 daqiqa–24 soat ichida domen ishga tushadi.
5. So'ng Vercel env'da `NEXTAUTH_URL` va `NEXT_PUBLIC_APP_URL` ni
   yangi domenga o'zgartiring va qayta deploy qiling.

---

## Deploy'dan keyin
- **Hodimlar kirishi:** Hodimlar → yangi hodim qo'shing (login + parol),
  ular domen orqali kirib ishlaydi.
- **Telegram:** Sozlamalar → Bildirishnomalar'ga bot tokenini qayta kiriting.
  Endi avtomatik eslatmalar ham ishlaydi.
- **Cron eslatma:** Vercel bepul (Hobby) rejasida cron kuniga 1 marta ishlaydi.
  Har daqiqa kerak bo'lsa: Vercel Pro yoki bepul **cron-job.org** orqali
  `https://domen/api/cron/check-reminders` ni har daqiqa chaqiring
  (Authorization: `Bearer <CRON_SECRET>`).

## Yangilanish
Keyinchalik kodni o'zgartirsangiz, GitHub Desktop'da **Commit → Push** qiling —
Vercel avtomatik yangi versiyani joylashtiradi.
