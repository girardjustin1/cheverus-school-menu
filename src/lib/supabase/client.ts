import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (key?.startsWith('sb_secret_'))
  throw new Error('A Supabase secret key must never be used in the browser.');
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
export const demoEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true' || !supabase;
