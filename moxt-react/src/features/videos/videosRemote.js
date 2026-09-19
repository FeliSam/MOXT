import { supabase } from '../../services/supabaseClient'

function toSnakeKey(key) {
  return String(key).replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`)
}

function toSnake(row) {
  const out = {}
  for (const [key, value] of Object.entries(row || {})) {
    out[toSnakeKey(key)] = value
  }
  return out
}

/** Persist a video row; awaited before navigate so feed refresh cannot prune it. */
export async function saveVideoRemote(video) {
  if (!supabase) throw new Error('Connexion indisponible')
  if (!video?.id) throw new Error('Identifiant vidéo manquant')

  const {
    businessName: _businessName,
    mimeType: _mimeType,
    ...row
  } = video

  const payload = toSnake({
    ...row,
    likes: Array.isArray(row.likes) ? row.likes : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    shareCount: Number(row.shareCount) || 0,
    viewCount: Number(row.viewCount) || 0,
  })

  const { error } = await supabase.from('videos').upsert(payload, { onConflict: 'id' })
  if (error) throw error
  return video
}

/** Warm thumbnail so the feed poster paints immediately after navigate. */
export function prefetchMediaUrl(url) {
  const href = String(url || '').trim()
  if (!href || typeof Image === 'undefined') return Promise.resolve()
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = href
  })
}
