import { supabase } from '../../services/supabaseClient'

/**
 * Recommandations serveur (fallback client si indisponible).
 * Brancher une RPC `marketplace_discovery_feed` quand le backend sera prêt.
 */
export async function fetchMarketplaceDiscoveryRemote(_ctx = {}) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.rpc('marketplace_discovery_feed')
    if (error) {
      if (error.code === '42883' || error.code === 'PGRST202') return null
      console.warn('[MOXT] marketplace_discovery_feed:', error.message)
      return null
    }
    if (!data || typeof data !== 'object') return null
    return data
  } catch {
    return null
  }
}
