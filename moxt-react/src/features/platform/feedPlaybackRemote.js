import { DEFAULT_FEED_PLAYBACK, normalizeFeedPlaybackConfig } from '../../config/feedPlayback'
import { supabase } from '../../services/supabaseClient'

export async function fetchFeedPlayback() {
  const { data, error } = await supabase
    .from('app_feed_playback')
    .select('config, updated_at')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return { config: { ...DEFAULT_FEED_PLAYBACK }, updatedAt: null, source: 'default' }
    }
    throw error
  }
  return {
    config: normalizeFeedPlaybackConfig(data?.config),
    updatedAt: data?.updated_at || null,
    source: 'remote',
  }
}

export async function adminUpdateFeedPlayback(config) {
  const payload = normalizeFeedPlaybackConfig(config)
  const { data, error } = await supabase.rpc('admin_update_app_feed_playback', { p_config: payload })
  if (error) throw error
  const remote = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  return normalizeFeedPlaybackConfig({ ...payload, ...remote })
}
