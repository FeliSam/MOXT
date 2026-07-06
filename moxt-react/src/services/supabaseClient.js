import { createSupabaseClient } from '@moxt/shared/supabase/createSupabaseClient.js'
import { createBrowserSessionStorage } from '@moxt/shared/supabase/createBrowserSessionStorage.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('[MOXT] Variables Supabase manquantes — mode simulé actif.')
}

export const supabase = createSupabaseClient({
  url: supabaseUrl,
  key: supabaseKey,
  storage: typeof localStorage !== 'undefined' ? createBrowserSessionStorage() : null,
})
