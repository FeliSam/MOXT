/**
 * Miniature du dernier élément d’un groupe de statuts (bulle de la rangée des statuts).
 * - image : dernière image du statut le plus récent (variante miniature CDN / Supabase si dispo)
 * - vidéo : poster / miniature existante, sinon première frame (sans lecture auto)
 * - texte : fond du statut (dégradé Moxt par défaut) + extrait lisible
 * Renvoie null s’il n’y a rien à montrer → la bulle garde l’avatar / le logo.
 */
import { avatarDisplayUrl } from '../account/avatarDisplayUrl'
import { resolveMediaDisplayUrl } from '../../services/media/mediaUrlUtils'

/** Taille demandée au CDN : bulle 48 px × 3 (écrans haute densité). */
export const STATUS_THUMB_PX = 144
export const STATUS_TEXT_EXCERPT_MAX = 32

function cleanUrl(value) {
  if (!value) return ''
  return resolveMediaDisplayUrl(value) || (typeof value === 'string' ? value.trim() : '')
}

/** Variante miniature existante (Supabase render / CDN `?w=&h=&fit=cover`), sinon l’URL telle quelle. */
export function statusThumbUrl(url, size = STATUS_THUMB_PX) {
  const resolved = cleanUrl(url)
  if (!resolved || resolved.startsWith('data:') || resolved.startsWith('blob:')) return resolved
  return avatarDisplayUrl(resolved, { width: size, height: size }) || resolved
}

/** Extrait court et lisible : espaces normalisés, coupe sur un mot + « … ». */
export function statusTextExcerpt(text, max = STATUS_TEXT_EXCERPT_MAX) {
  const flat = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

function statusVideoSource(status) {
  const video = status?.video
  const raw =
    status?.videoUrl ||
    status?.video_url ||
    (typeof video === 'string' ? video : video?.url || video?.src) ||
    ''
  return cleanUrl(raw)
}

function statusVideoPoster(status) {
  const video = status?.video && typeof status.video === 'object' ? status.video : {}
  return (
    status?.posterUrl ||
    status?.poster_url ||
    status?.thumbnailUrl ||
    status?.thumbnail_url ||
    video.posterUrl ||
    video.thumbnailUrl ||
    video.poster ||
    ''
  )
}

/** Fond d’un statut texte : couleur / dégradé enregistré s’il existe, sinon null (dégradé Moxt). */
export function statusTextBackground(status) {
  const value =
    status?.background || status?.backgroundColor || status?.bgColor || status?.bg_color || ''
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed) || /^(rgb|hsl)a?\(/i.test(trimmed)) return trimmed
  if (/^(linear|radial|conic)-gradient\(/i.test(trimmed)) return trimmed
  return null
}

/** Statut le plus récent du groupe (les items sont triés du plus ancien au plus récent). */
export function latestStatusOfGroup(group) {
  const items = Array.isArray(group?.items) ? group.items : []
  if (!items.length) return null
  let latest = items[items.length - 1]
  let latestMs = new Date(latest?.createdAt).getTime()
  for (const item of items) {
    const ms = new Date(item?.createdAt).getTime()
    if (Number.isFinite(ms) && (!Number.isFinite(latestMs) || ms > latestMs)) {
      latest = item
      latestMs = ms
    }
  }
  return latest
}

/**
 * Choix de la miniature d’un groupe.
 * @returns {null | { key, kind: 'image'|'video'|'text', src?, fullSrc?, videoSrc?, text?, background? }}
 */
export function pickStatusThumb(group, { size = STATUS_THUMB_PX } = {}) {
  const status = latestStatusOfGroup(group)
  if (!status) return null
  const id = status.id || ''

  const videoSrc = statusVideoSource(status)
  if (videoSrc) {
    const poster = statusVideoPoster(status)
    return {
      key: `${id}:video`,
      kind: 'video',
      src: poster ? statusThumbUrl(poster, size) : '',
      fullSrc: poster ? cleanUrl(poster) : '',
      videoSrc,
    }
  }

  const images = (Array.isArray(status.images) ? status.images : []).filter(
    (url) => typeof url === 'string' && url.trim(),
  )
  if (images.length) {
    const last = images[images.length - 1]
    return {
      key: `${id}:image:${images.length - 1}`,
      kind: 'image',
      src: statusThumbUrl(last, size),
      fullSrc: cleanUrl(last),
    }
  }

  const text = statusTextExcerpt(status.caption || status.text)
  if (text) {
    return { key: `${id}:text`, kind: 'text', text, background: statusTextBackground(status) }
  }
  return null
}
