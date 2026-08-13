// src/client.js
//
// The Supabase client. This is the ONLY file allowed to know these
// environment variables exist — everything else goes through src/api/.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env, then restart the dev server.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
