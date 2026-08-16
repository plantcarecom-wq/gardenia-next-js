import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url("Must be a valid MongoDB URI").default("mongodb://localhost:27017/gardenia"),
  AUTH_SECRET: z.string().min(32, "Auth secret must be at least 32 characters").default("01234567890123456789012345678912"),
  APP_NAME: z.string().default("gardenia"),
  APP_BASE_CURRENCY: z.string().default("PKR"),
  SERVICES_MODULE_ENABLED: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_SERVICES_MODULE_ENABLED: z.enum(["true", "false"]).default("false"),
  MEDIA_STORAGE_PROVIDER: z.enum(["cloudinary", "local"]).default("cloudinary"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  LOCAL_UPLOAD_DIR: z.string().default("./public/uploads"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(5),
  NOTIFICATION_RETENTION_DAYS: z.coerce.number().default(90),
  LONG_POLL_TIMEOUT_MS: z.coerce.number().default(20000),
  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().min(6).optional(),
  CRON_SECRET: z.string().optional(),
  VERCEL: z.string().optional(),
  APP_URL: z.string().url().default('http://localhost:3000'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const _env = envSchema.safeParse({
  MONGODB_URI: process.env.MONGODB_URI,
  AUTH_SECRET: process.env.AUTH_SECRET,
  APP_NAME: process.env.APP_NAME,
  APP_BASE_CURRENCY: process.env.APP_BASE_CURRENCY,
  SERVICES_MODULE_ENABLED: process.env.SERVICES_MODULE_ENABLED,
  NEXT_PUBLIC_SERVICES_MODULE_ENABLED: process.env.NEXT_PUBLIC_SERVICES_MODULE_ENABLED,
  MEDIA_STORAGE_PROVIDER: process.env.MEDIA_STORAGE_PROVIDER,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  LOCAL_UPLOAD_DIR: process.env.LOCAL_UPLOAD_DIR,
  MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB,
  NOTIFICATION_RETENTION_DAYS: process.env.NOTIFICATION_RETENTION_DAYS,
  LONG_POLL_TIMEOUT_MS: process.env.LONG_POLL_TIMEOUT_MS,
  ADMIN_SEED_EMAIL: process.env.ADMIN_SEED_EMAIL,
  ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD,
  CRON_SECRET: process.env.CRON_SECRET,
  VERCEL: process.env.VERCEL,
  APP_URL: process.env.APP_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
});

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;

if (env.MEDIA_STORAGE_PROVIDER === "local" && env.VERCEL === "1") {
  console.warn("⚠️ WARNING: MEDIA_STORAGE_PROVIDER is 'local' but running on Vercel. Uploads will not persist.");
}
