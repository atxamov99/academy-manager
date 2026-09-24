# MARS · Academy Manager

Academy Manager uchun guruh va mentor boshqaruv tizimi. Asosiy maqsad: **mentor kelmay qolganda uning o'rniga bo'sh va mos mentorni bir daqiqada topib qo'yish.**

## Ishga tushirish

Kerak: **Node.js 20+** va **MongoDB** (lokal yoki MongoDB Atlas).

```bash
npm run setup                          # server + web kutubxonalarini o'rnatish
cp server/.env.example server/.env     # sozlamalar (MONGO_URL ni tekshiring)
npm run seed                           # demo ma'lumot (bazani tozalab to'ldiradi)
npm run dev                            # server :4000 + sayt :5173
```

Brauzerda: **http://localhost:5173**
Login: `manager@mars.uz`, parol: `mars2026`

> MongoDB lokal o'rnatilmagan bo'lsa (macOS): `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`.
> Yoki Atlas ishlating: `server/.env` dagi `MONGO_URL` ga Atlas'dagi `mongodb+srv://...` satrini qo'ying.

Testlar: `npm test` (mentor tanlash mantig'i). E2E: `python3 e2e/flow.py` (Playwright, server va sayt ishlab turishi kerak).

## Imkoniyatlar

| Sahifa | Nima qiladi |
|---|---|
| **Bosh sahifa** | "Mentor kerak": keyingi 7 kunda mentori kelmaydigan darslar. Bugungi darslar, mentorlar yuklamasi, oxirgi almashtirishlar |
| **Mentorni almashtirish** | Bir dars yoki doimiy. Tizim mentorlarni reytinglaydi, har birining yonida "nega" izohi bor. Mos kelmaganlar sababi bilan ko'rsatiladi. Yangi mentorga izoh qoldiriladi |
| **Guruhlar** | Qo'shish/tahrirlash, jadval, "guruh qayerga keldi" izohi, almashtirishlar tarixi |
| **Mentorlar** | Shu oy va jami o'tgan darslar, zamenalar, haftalik jadval (grid), qachon darsi bor, "Kela olmaydi" belgisi |
| **Tarix va hisobot** | Beqaror guruhlar, ko'p kelmagan mentorlar, eng ko'p yordam berganlar, sabablar |

## Mentor qanday tanlanadi

1. **Qattiq filtr** (biri bajarilmasa mentor chiqarib tashlanadi): o'sha vaqtda boshqa guruhda darsi bor (zamenalar hisobga olinadi), "kela olmaydi" deb belgilangan, yo'nalishni o'tmaydi, guruh tilida dars o'tmaydi, ish vaqtiga sig'maydi.
2. **Ball (0–100):** yuklama kam (40) · guruhni taniydi (25) · daraja mos (20) · so'nggi 60 kunda kam zamena qilgan, ya'ni adolatli taqsimot (15).
3. Server tanlovni **qayta tekshiradi**: brauzerdan band mentorni yuborib bo'lmaydi (409).

## Tuzilish

```
server/   Express + Mongoose + JWT (httpOnly cookie) + Joi
  src/lib/schedule.js   jadval va tavsiya mantig'i (sof funksiyalar, test qilingan)
  src/routes/           auth, CRUD, almashtirish, dashboard/hisobot
  src/seed.js           demo ma'lumot
web/      React + Vite + Tailwind + TanStack Query
docs/REJA.md  muammo tahlili, arxitektura, keyingi bosqichlar
e2e/      Playwright oqim testi
```
