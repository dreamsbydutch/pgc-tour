import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    BASE_URL: z.string(),
    DATABASE_URL: z.string(),
    DIRECT_URL: z.string(),
    SUPABASE_JWT_SECRET: z.string(),
    // POSTGRES_URL: z.string(),
    // POSTGRES_PRISMA_URL: z.string(),
    // POSTGRES_URL_NO_SSL: z.string(),
    // POSTGRES_URL_NON_POOLING: z.string(),
    // POSTGRES_USER: z.string(),
    // POSTGRES_HOST: z.string(),
    // POSTGRES_PASSWORD: z.string(),
    // POSTGRES_DATABASE: z.string(),
    EXTERNAL_DATA_API_URL: z.string(),
    EXTERNAL_DATA_API_KEY: z.string(),
    TOUR_MAX_SIZE: z.string(),
    // ONESIGNAL_API_KEY: z.string(),
    // GODADDY_EMAIL: z.string(),
    // GODADDY_PASSWORD: z.string(),
    // SMTP_HOST: z.string(),
    // SMTP_PORT: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_GOOGLE_ANALYTICS: z.string(),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string(),
    NEXT_PUBLIC_VAPID_PRIVATE_KEY: z.string(),

    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    BASE_URL: process.env.BASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    TOUR_MAX_SIZE: process.env.TOUR_MAX_SIZE,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_VAPID_PRIVATE_KEY: process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY,
    // ONESIGNAL_API_KEY: process.env.ONESIGNAL_API_KEY,
    // GODADDY_EMAIL: process.env.GODADDY_EMAIL,
    // GODADDY_PASSWORD: process.env.GODADDY_PASSWORD,
    // SMTP_HOST: process.env.SMTP_HOST,
    // SMTP_PORT: process.env.SMTP_PORT,
    // POSTGRES_URL: process.env.POSTGRES_URL,
    // POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    // POSTGRES_URL_NO_SSL: process.env.POSTGRES_URL_NO_SSL,
    // POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    // POSTGRES_USER: process.env.POSTGRES_USER,
    // POSTGRES_HOST: process.env.POSTGRES_HOST,
    // POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    // POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
    EXTERNAL_DATA_API_URL: process.env.EXTERNAL_DATA_API_URL,
    EXTERNAL_DATA_API_KEY: process.env.EXTERNAL_DATA_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_ANALYTICS: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
