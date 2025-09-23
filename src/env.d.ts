/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly PUBLIC_ADMIN_TELEGRAM_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}