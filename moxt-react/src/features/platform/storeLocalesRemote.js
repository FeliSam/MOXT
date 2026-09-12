import { DEFAULT_STORE_LOCALES, normalizeStoreLocalesConfig } from '../../config/storeLocales'
import { supabase } from '../../services/supabaseClient'

export async function fetchStoreLocales() {
  const { data, error } = await supabase
    .from('app_store_locales')
    .select('config, updated_at')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return { locales: { ...DEFAULT_STORE_LOCALES }, updatedAt: null, source: 'default' }
    }
    throw error
  }
  return {
    locales: normalizeStoreLocalesConfig(data?.config),
    updatedAt: data?.updated_at || null,
    source: 'remote',
  }
}

export async function adminUpdateStoreLocales(locales) {
  const payload = normalizeStoreLocalesConfig(locales)
  const { data, error } = await supabase.rpc('admin_update_app_store_locales', { p_config: payload })
  if (error) throw error
  const remote = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  return normalizeStoreLocalesConfig({ ...payload, ...remote })
}
