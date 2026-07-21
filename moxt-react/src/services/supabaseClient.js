import { createSupabaseClient } from '@moxt/shared/supabase/createSupabaseClient.js'
import { createBrowserSessionStorage } from '@moxt/shared/supabase/createBrowserSessionStorage.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('[MOXT] Variables Supabase manquantes — mode simulé actif.')
}

const client = createSupabaseClient({
  url: supabaseUrl,
  key: supabaseKey,
  storage: typeof localStorage !== 'undefined' ? createBrowserSessionStorage() : null,
})

/**
 * Single-flight autour de refreshSession — évite refresh_token_already_used
 * (keepalive + visibility + autoRefresh + boot en parallèle).
 */
if (client?.auth?.refreshSession) {
  const originalRefreshSession = client.auth.refreshSession.bind(client.auth)
  let refreshInFlight = null
  client.auth.refreshSession = (...args) => {
    if (!refreshInFlight) {
      refreshInFlight = Promise.resolve(originalRefreshSession(...args)).finally(() => {
        refreshInFlight = null
      })
    }
    return refreshInFlight
  }
}

export const supabase = client
