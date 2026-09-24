# Academy Manager — muammo, yechim va reja

## 1. Aytilgan og'riq
Academy Manager guruhning mentorini almashtirishi kerak bo'lganda (kasal, ta'til, ishdan ketdi, jadval o'zgardi) qiynaladi: **kim bo'sh va kim mos** ekanini topish qiyin.

## 2. Ko'rinmayotgan muammolar va yechimlar

| # | Muammo | Oqibati | Tizimdagi yechim |
|---|---|---|---|
| 1 | Bandlik ma'lumoti tarqoq (boshda, Telegramda) | Hammaga yozib, qo'ng'iroq qilib chiqiladi | Barcha jadval bitta joyda. Bandlik avtomatik hisoblanadi |
| 2 | "Bo'sh" mentor "mos" degani emas | Python mentori Frontend guruhga kiradi | Yo'nalish, til, daraja va ish vaqti bo'yicha filtr |
| 3 | Bir darslik va doimiy almashtirish ajratilmagan | Guruh "yo'qolib" qoladi, tarix buziladi | Ikki alohida tur. Doimiyda asosiy mentor sanadan boshlab o'zgaradi |
| 4 | Konflikt: mentor bir vaqtda 2 guruhga qo'yiladi | Dars o'tmay qoladi | Server tomonda konflikt tekshiruvi (409) |
| 5 | Yuklama muvozanati yo'q, doim bir "ishonchli" mentor olinadi | U charchaydi, keyin ketadi | Ballda yuklama va "so'nggi 60 kunda zamena" jarimasi |
| 6 | Kontekst topshirilmaydi | Yangi mentor guruh qayerga kelganini bilmaydi | "Guruh qayerga keldi" izohi almashtirishda yangi mentorga o'tadi |
| 7 | Tarix va hisobot yo'q | Muammo takrorlanaveradi | Tarix va hisobot: beqaror guruhlar, ko'p kelmaydiganlar, sabablar |
| 8 | Kelmaslik kech bilinadi | Dars oldidan shoshilinch qidiruv | "Kela olmaydi" belgisi. Darslar oldindan "Mentor kerak" ga tushadi (7 kun oldin) |
| 9 | Mentor necha dars o'tgani noma'lum | Oylik hisob-kitobda xato | Mentor sahifasida shu oy, jami va zamena darslari |

## 3. Arxitektura

```
[Brauzer: React + Vite]  --/api (cookie)-->  [Express API]  -->  [MongoDB]
                                                  |
                                   lib/schedule.js (sof mantiq)
```

- **Modellar:** Manager · Mentor (yo'nalish, til, daraja, ish vaqti) · Group (jadval, mentor, ochilgan sana, izoh) · Absence (kela olmaydi) · Replacement (bir dars/doimiy, sabab, izoh, ball).
- **Asosiy mantiq** DB'dan ajratilgan sof funksiyalarda. 8 ta unit test bilan himoyalangan.
- **Tarixga to'g'ri qarash:** qaysi sanada darsni kim o'tgani doimiy va vaqtinchalik almashtirishlar tarixidan hisoblanadi. Shuning uchun o'tgan darslar statistikasi to'g'ri chiqadi.
- **Xavfsizlik:** faqat Academy Manager kiradi (JWT, httpOnly cookie, bcrypt). Barcha kiruvchi ma'lumot Joi bilan tekshiriladi. O'chirish o'rniga arxivlash, tarix buzilmaydi.

## 4. Keyingi bosqichlar
1. **Mentor kabineti va Telegram bot:** mentor o'zi "kela olmayman" deydi, tanlangan mentorga Telegramda "Siz FN-101 ga qo'yildingiz" xabari boradi va u tasdiqlaydi.
2. **Davomat:** dars haqiqatan o'tganini belgilash, statistika hisobdan emas, faktdan chiqadi.
3. **Oylik to'lov hisobi:** zamena darslari uchun avtomatik hisob.
4. **Filial va xonalar:** xona bandligini ham tekshirish.
5. **Mars Core bilan integratsiya:** guruh va mentor ma'lumotini qo'lda kiritmasdan olish.
