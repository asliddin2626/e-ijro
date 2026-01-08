# e-ijro tizimi

**e-ijro** – viloyat va tuman bo‘limlari o‘rtasida topshiriqlar almashish va nazorat qilish uchun oddiy va qulay veb-tizim.

### Loyiha haqida
Tizim quyidagi rollarni qo‘llab-quvvatlaydi:
- **Admin** – foydalanuvchilarni boshqarish (qo‘shish, tahrirlash, parol reset, o‘chirish), topshiriq o‘chirish
- **Viloyat bo‘limi** – yangi topshiriq yaratish
- **Tuman bo‘limi** – topshiriqqa javob berish (izoh + fayl biriktirish)
- **Tahlilchi** – topshiriqlar va javoblarni ko‘rish (faqat o‘qish huquqi)

### Asosiy funksiyalar
- Topshiriq yaratish (sarlavha, tavsif, muddat, javoblar ko‘rinishi)
- Javob berish (izoh + bir nechta fayl yuklash)
- Javoblar holatini ko‘rish (kutilmoqda, qabul qilingan, rad etilgan)
- Fayllarni yuklab olish
- Viloyat bo‘limi javoblarni qabul/rad etishi mumkin
- Admin uchun to‘liq boshqaruv paneli (4 guruh bo‘yicha yig‘iladigan ro‘yxat)
- Topshiriqlar ro‘yxati yig‘iladigan (accordion) – nomi bosilganda batafsil ma'lumot chiqadi

### Texnologiyalar
- **Frontend**: React + Vite
- **Backend**: Node.js + Express + Sequelize (PostgreSQL)
- **Database**: PostgreSQL
- **Fayl saqlash**: local uploads papkasi

### Ishga tushirish

#### 1. Repository ni klon qiling
```bash
git clone https://github.com/asliddin2626/e-ijro.git
cd e-ijro
