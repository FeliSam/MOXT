import { createSupabaseClient } from '@moxt/shared/supabase/createSupabaseClient.js';

import { createMobileSessionStorage } from './sessionStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[MOXT Mobile] Variables Supabase manquantes — mode simulé actif.');
}

export const supabase = createSupabaseClient({
  url: supabaseUrl,
  key: supabaseKey,
  storage: supabaseUrl && supabaseKey ? createMobileSessionStorage() : null,
});
