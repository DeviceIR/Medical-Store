# Medical Store

فروشگاه دوزبانه تجهیزات پزشکی: Next.js + NestJS + PostgreSQL.

## اجرا

1. PostgreSQL: یا سرویس ویندوز خودتان (پورت ۵۴۳۲) یا دیتابیس توکار پروژه:

```bash
pnpm db:up
```

این Postgres را روی پورت **۵۴۳۳** با کاربر `postgres` / رمز `postgres` بالا می‌آورد. `DATABASE_URL` پیش‌فرض همین است.

اگر Postgres سیستم را می‌خواهید، `DATABASE_URL` را در `.env` و `apps/api/.env` عوض کنید.
2. فایل `.env.example` را به `.env` کپی کنید و `DATABASE_URL` را با پسورد واقعی Postgres تنظیم کنید. همان مقادیر را در `apps/api/.env` هم بگذارید.
3. نصب و مهاجرت:

```bash
pnpm db:up
pnpm install
pnpm db:generate
pnpm --filter @medical/api exec prisma db push
pnpm db:seed
pnpm dev
```

- فروشگاه: http://localhost:3000/fa
- انگلیسی: http://localhost:3000/en
- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/api/docs

## حساب ادمین پیش‌فرض

- ایمیل: `admin@medical.local`
- رمز: `Admin@12345`
- موبایل OTP: `09120000000` / کد `123456` (حالت توسعه)

کوپن نمونه: `WELCOME10`

درگاه زرین‌پال و استرایپ در حالت بدون کلید واقعی، پرداخت را شبیه‌سازی می‌کنند. برای تولید، `ZARINPAL_MERCHANT_ID` و `STRIPE_SECRET_KEY` را بگذارید.

## ساختار

- `apps/web` فروشگاه و پنل `/admin`
- `apps/api` NestJS
- `packages/shared` enum و ثابت‌ها
