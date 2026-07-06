import { createClient } from '@supabase/supabase-js'

/**
 * @param {{ url?: string, key?: string, storage?: import('@supabase/supabase-js').SupportedStorage | null }} options
 */
export function createSupabaseClient({ url, key, storage = null } = {}) {
  if (!url || !key) return null

  return createClient(url, key, {
    auth: {
      persistSession: Boolean(storage),
      autoRefreshToken: Boolean(storage),
      detectSessionInUrl: typeof globalThis.window !== 'undefined',
      storage: storage ?? undefined,
    },
  })
}
