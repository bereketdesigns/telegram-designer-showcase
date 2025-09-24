import { createClient } from '@supabase/supabase-js';

// Access environment variables with the PUBLIC_ prefix for client-side access
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Check .env file and Vercel Environment Variables.');
  // For the client-side app, if these are missing, it's a critical error
  // that prevents Supabase from initializing.
  // We will let the app show an error, but this helps catch it early.
  throw new Error('Supabase URL and Anon Key are required for the application to function.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);