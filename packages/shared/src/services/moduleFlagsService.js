import { DEFAULT_DEV_MODULE_FLAGS, normalizeDevModuleFlags } from '../config/moduleFlags.js'

/**
 * Même lecture que le web (platformModulesRemote.fetchAppModuleFlags) :
 * ligne unique `app_module_flags` id=1 ; table absente → drapeaux par défaut.
 */
export async function fetchAppModuleFlags(client) {
  if (!client) return { flags: { ...DEFAULT_DEV_MODULE_FLAGS }, updatedAt: null, source: 'default' }
  const { data, error } = await client
    .from('app_module_flags')
    .select('config, updated_at')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return { flags: { ...DEFAULT_DEV_MODULE_FLAGS }, updatedAt: null, source: 'default' }
    }
    throw error
  }
  return {
    flags: data?.config ? normalizeDevModuleFlags(data.config) : { ...DEFAULT_DEV_MODULE_FLAGS },
    updatedAt: data?.updated_at || null,
    source: 'remote',
  }
}

/** Économie Stars active seulement si le drapeau module est on (web selectStarsModuleEnabled). */
export function isStarsModuleEnabled(flags) {
  return Boolean(normalizeDevModuleFlags(flags || DEFAULT_DEV_MODULE_FLAGS).stars)
}
