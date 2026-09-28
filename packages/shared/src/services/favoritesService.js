import { fromRows } from '../utils/remoteRowMapper.js'
import { isSourceItemLive } from '../utils/sourceLiveStatus.js'
import { entityFromRemoteRow, rowsOrEmpty, rowsOrThrow } from './rowUtils.js'
import { businessFromRemoteRow } from './businessesService.js'

export const FAVORITES_LIMIT = 200

const ENTITY_TABLES = {
  listing: 'listings',
  job: 'jobs',
  parcel: 'parcels',
  business: 'businesses',
  event: 'events',
}

export const FAVORITE_PATHS = {
  listing: (id) => `/marketplace/${id}`,
  parcel: (id) => `/parcels/${id}`,
  job: (id) => `/jobs/${id}`,
  event: (id) => `/events/${id}`,
  business: (id) => `/businesses/${id}`,
}

export async function fetchFavoriteRows(client, userId, { limit = FAVORITES_LIMIT } = {}) {
  if (!client || !userId) return []
  const result = await client.from('favorites').select('*').eq('user_id', userId).limit(limit)
  return fromRows(rowsOrThrow(result, 'Favoris'))
}

function mapEntity(type, row) {
  return type === 'business' ? businessFromRemoteRow(row) : entityFromRemoteRow(row)
}

/** Charge les entités ciblées par les favoris (par type), indexées `type:id`. */
export async function fetchFavoriteEntities(client, favorites = []) {
  const idsByType = {}
  for (const item of favorites) {
    if (!ENTITY_TABLES[item.relatedType] || !item.relatedId) continue
    if (!idsByType[item.relatedType]) idsByType[item.relatedType] = new Set()
    idsByType[item.relatedType].add(String(item.relatedId))
  }
  const entries = await Promise.all(
    Object.entries(idsByType).map(async ([type, ids]) => {
      const result = await client.from(ENTITY_TABLES[type]).select('*').in('id', [...ids])
      return rowsOrEmpty(result).map((row) => [`${type}:${row.id}`, mapEntity(type, row)])
    }),
  )
  return new Map(entries.flat())
}

/**
 * Fusion comme le web (mergeUserFavorites) : favoris du compte + favoris « legacy »
 * des annonces (payload.favorites contient l’utilisateur), puis retrait des sources
 * supprimées ou plus en ligne (isSourceItemLive).
 */
export function mergeFavorites({ userId, accountFavorites = [], legacyListings = [], entities = new Map() }) {
  const own = accountFavorites.filter((item) => item.userId === userId)
  const accountListingIds = new Set(own.filter((item) => item.relatedType === 'listing').map((item) => item.relatedId))
  const legacy = legacyListings
    .filter((item) => item.favorites?.includes(userId) && !accountListingIds.has(item.id))
    .map((item) => ({
      id: `listing-${item.id}`,
      relatedId: item.id,
      relatedType: 'listing',
      title: item.title,
      path: FAVORITE_PATHS.listing(item.id),
      legacy: true,
    }))
  for (const item of legacyListings) entities.set(`listing:${item.id}`, item)

  return [...own, ...legacy]
    .map((item) => ({ ...item, entity: entities.get(`${item.relatedType}:${item.relatedId}`) || null }))
    .filter((item) => isSourceItemLive(item.relatedType, item.entity))
    .map((item) => ({
      ...item,
      title: item.entity?.title || item.entity?.name || item.title || '',
      path: item.path || FAVORITE_PATHS[item.relatedType]?.(item.relatedId) || '',
    }))
}

export async function fetchUserFavorites(client, userId) {
  if (!client || !userId) return []
  const accountFavorites = await fetchFavoriteRows(client, userId)
  const legacyRes = await client
    .from('listings')
    .select('*')
    .contains('payload', { favorites: [userId] })
    .limit(FAVORITES_LIMIT)
  const legacyListings = rowsOrEmpty(legacyRes).map(entityFromRemoteRow).filter(Boolean)
  const entities = await fetchFavoriteEntities(client, accountFavorites)
  return mergeFavorites({ userId, accountFavorites, legacyListings, entities })
}
