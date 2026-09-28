import { fromRows } from '../utils/remoteRowMapper.js'
import { entityFromRemoteRow, rowsOrThrow } from './rowUtils.js'

export const POSTS_LIMIT = 40
export const POSTS_STAFF_LIMIT = 80
export const VIDEOS_LIMIT = 50
export const STATUSES_LIMIT = 60

export const STATUS_COLUMNS =
  'id, author_id, author_name, author_avatar_url, business_id, images, viewed_by, created_at, expires_at, is_official'

/** Même requête que le web (loadAllData) : publiées + les miennes, triées par partage puis date. */
export async function fetchFeedPosts(client, userId, { isStaff = false } = {}) {
  if (!client) return []
  let query = client.from('posts').select('*')
  if (!isStaff && userId) query = query.or(`status.eq.published,author_id.eq.${userId}`)
  const result = await query
    .order('last_shared_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(isStaff ? POSTS_STAFF_LIMIT : POSTS_LIMIT)
  return rowsOrThrow(result, 'Publications').map(entityFromRemoteRow).filter(Boolean)
}

export async function fetchVideos(client, { limit = VIDEOS_LIMIT } = {}) {
  if (!client) return []
  const result = await client.from('videos').select('*').order('created_at', { ascending: false }).limit(limit)
  return rowsOrThrow(result, 'Vidéos').map(entityFromRemoteRow).filter(Boolean)
}

/** Statuts non expirés (web statusSync). */
export async function fetchActiveStatuses(client, { limit = STATUSES_LIMIT, now = new Date() } = {}) {
  if (!client) return []
  const result = await client
    .from('statuses')
    .select(STATUS_COLUMNS)
    .gt('expires_at', now.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)
  return fromRows(rowsOrThrow(result, 'Statuts')).map((item) => ({
    ...item,
    images: Array.isArray(item.images) ? item.images : [],
    viewedBy: Array.isArray(item.viewedBy) ? item.viewedBy : [],
  }))
}

/** Regroupe les statuts par auteur (un rond par auteur, le plus récent d’abord). */
export function groupStatusesByAuthor(statuses = [], userId) {
  const groups = new Map()
  for (const status of statuses) {
    const key = status.businessId ? `business:${status.businessId}` : `user:${status.authorId}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        authorId: status.authorId,
        businessId: status.businessId || null,
        name: status.authorName || '',
        avatarUrl: status.authorAvatarUrl || null,
        isOfficial: Boolean(status.isOfficial),
        items: [],
      })
    }
    groups.get(key).items.push(status)
  }
  return [...groups.values()].map((group) => ({
    ...group,
    unseen: group.items.some((item) => !(item.viewedBy || []).includes(userId)),
  }))
}
