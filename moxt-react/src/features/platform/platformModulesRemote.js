import { normalizeDevModuleFlags } from '../../config/devModules'
import { fetchAppModuleFlags as fetchAppModuleFlagsFromClient } from '@moxt/shared/services/moduleFlagsService.js'
import { supabase } from '../../services/supabaseClient'

export async function fetchAppModuleFlags() {
  // Lecture partagée web + mobile (packages/shared/services/moduleFlagsService).
  return fetchAppModuleFlagsFromClient(supabase)
}

export async function adminUpdateAppModuleFlags(flags) {
  const payload = normalizeDevModuleFlags(flags)
  const { data, error } = await supabase.rpc('admin_update_app_module_flags', { p_config: payload })
  if (error) throw error
  const remote = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  return normalizeDevModuleFlags({ ...payload, ...remote })
}
