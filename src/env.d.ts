/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Renamed to PUBLIC_ for client-side access in Astro
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_ADMIN_TELEGRAM_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}