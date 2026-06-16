# Backend - سرویس دهنده API

## 📋 مسیر پروژه

```
backend/
├── src/
│   ├── config/              # تنظیمات پایگاه داده و محیط
│   │   └── database.js
│   ├── controllers/         # کنترل‌کننده‌های درخواست
│   │   ├── authController.js
│   │   ├── accountController.js
│   │   ├── journalController.js
│   │   ├── reportController.js
│   │   └── userController.js
│   ├── models/             # مدل‌های داده
│   │   ├── User.js
│   │   ├── Account.js
│   │   ├── Journal.js
│   │   └── Report.js
│   ├── routes/             # مسیرهای API
│   │   ├── authRoutes.js
│   │   ├── accountRoutes.js
│   │   ├── journalRoutes.js
│   │   ├── reportRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/         # میانوایه‌های درخواست
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── validator.js
│   ├── services/           # سرویس‌های تجاری
│   │   ├── authService.js
│   │   ├── accountService.js
│   │   ├── journalService.js
│   │   └── reportService.js
│   ├── utils/              # توابع کمکی
│   │   ├── logger.js
│   │   └── helpers.js
│   └── app.js              # تنظیمات اصلی Express
├── .env                     # متغیرهای محیطی
├── server.js               # نقطه شروع سرویس
├── package.json            # وابستگی‌ها
└── README.md
```

## 🚀 نصب و اجرا

```bash
# نصب وابستگی‌ها
npm install

# ایجاد فایل .env
cp .env.example .env

# اجرا در حالت توسعه
npm run dev

# اجرا در حالت تولید
npm start
```

## 🔗 نقاط پایانی API (Endpoints)

### احراز هویت
- `POST /api/auth/register` - ثبت‌نام
- `POST /api/auth/login` - ورود
- `POST /api/auth/refresh` - تازه‌سازی توکن
- `POST /api/auth/logout` - خروج

### حساب‌های شناور
- `GET /api/accounts` - دریافت تمام حساب‌ها
- `GET /api/accounts/:id` - دریافت حساب خاص
- `POST /api/accounts` - ایجاد حساب جدید
- `PUT /api/accounts/:id` - به‌روزرسانی حساب
- `DELETE /api/accounts/:id` - حذف حساب

### دفتر روزنامه
- `GET /api/journals` - دریافت تمام سند‌ها
- `GET /api/journals/:id` - دریافت سند خاص
- `POST /api/journals` - ایجاد سند جدید
- `PUT /api/journals/:id` - ویرایش سند
- `DELETE /api/journals/:id` - حذف سند

### گزارش‌ها
- `GET /api/reports/balance-sheet` - تراز‌نامه
- `GET /api/reports/income-statement` - صورت‌حساب درآمد
- `GET /api/reports/ledger` - دفتر بزرگ
- `GET /api/reports/trial-balance` - تراز‌آزمایشی

### کاربران
- `GET /api/users` - دریافت تمام کاربران
- `GET /api/users/:id` - دریافت کاربر خاص
- `POST /api/users` - ایجاد کاربر جدید
- `PUT /api/users/:id` - به‌روزرسانی کاربر
- `DELETE /api/users/:id` - حذف کاربر

## 🔐 احراز هویت

تمام درخواست‌های API (به جز login و register) نیاز به توکن JWT در header دارند:

```
Authorization: Bearer <token>
```

## 📦 متغیرهای محیطی

فایل `.env` باید شامل:

```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=accounting_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
MODDIAN_API_URL=https://api.moddian.ir
MODDIAN_API_KEY=your_api_key
```

## 🧪 تست

```bash
npm test
```

## 📝 لاگ‌های سرویس

لاگ‌ها در فایل `logs/app.log` ذخیره می‌شوند.

---

**آخرین به‌روزرسانی:** 2026-06-16
