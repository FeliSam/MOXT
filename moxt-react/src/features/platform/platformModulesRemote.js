import { DEFAULT_DEV_MODULE_FLAGS, normalizeDevModuleFlags } from '../../config/devModules'
import { supabase } from '../../services/supabaseClient'

function mapRow(row) {
  if (!row?.config) return { ...DEFAULT_DEV_MODULE_FLAGS }
  return normalizeDevModuleFlags(row.config)
}

export async function fetchAppModuleFlags() {
  const { data, error } = await supabase.from('app_module_flags').select('config, updated_at').eq('id', 1).maybeSingle()
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return { flags: { ...DEFAULT_DEV_MODULE_FLAGS }, updatedAt: null, source: 'default' }
    }
    throw error
  }
  return {
    flags: mapRow(data),
    updatedAt: data?.updated_at || null,
    source: 'remote',
  }
}

export async function adminUpdateAppModuleFlags(flags) {
  const payload = normalizeDevModuleFlags(flags)
  const { data, error } = await supabase.rpc('admin_update_app_module_flags', { p_config: payload })
  if (error) throw error
  return normalizeDevModuleFlags(data || payload)
}
