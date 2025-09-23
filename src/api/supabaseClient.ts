import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are defined in your .env file and Vercel settings
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Check .env file and Vercel Environment Variables.');
  // In a real production app, you might want to throw an error or handle this more gracefully.
  // For now, logging to console is sufficient.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);