import { DEFAULT_AVATAR_SETTINGS, normalizeAvatarSettings } from '../../config/avatarSettings'
import { supabase } from '../../services/supabaseClient'

const MISSING_RELATION = new Set(['42P01', 'PGRST205', 'PGRST202', '42883'])

export async function fetchAvatarSettings() {
  const { data, error } = await supabase
    .from('app_avatar_settings')
    .select('config, updated_at')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return { config: { ...DEFAULT_AVATAR_SETTINGS }, updatedAt: null, source: 'default' }
    }
    throw error
  }
  return {
    config: normalizeAvatarSettings(data?.config),
    updatedAt: data?.updated_at || null,
    source: 'remote',
  }
}

export async function adminUpdateAvatarSettings(config) {
  const payload = normalizeAvatarSettings(config)
  const { data, error } = await supabase.rpc('admin_update_app_avatar_settings', {
    p_config: payload,
  })
  if (error) throw error
  const remote = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  return normalizeAvatarSettings({ ...payload, ...remote })
}

/** Répartition lecture seule des profils par style d’avatar (admin). null si indisponible. */
export async function fetchAvatarStyleStats() {
  const { data, error } = await supabase.rpc('admin_avatar_style_stats')
  if (error) {
    if (MISSING_RELATION.has(error.code)) return null
    throw error
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const read = (key) => Math.max(0, Number(data[key]) || 0)
  return {
    portrait: read('portrait'),
    lorelei: read('lorelei'),
    photo: read('photo'),
    none: read('none'),
    total: read('total'),
  }
}
