import { fromRows } from '../utils/remoteRowMapper.js'
import { countBrowseParcelTabs } from '../domain/parcelRules.js'
import { rowsOrThrow } from './rowUtils.js'

/** Même fenêtre que le web (loadAllData PUBLIC_LIMIT) : les onglets Colis comptent sur ces 50 trajets. */
export const PARCELS_PUBLIC_LIMIT = 50
export const USER_ROWS_LIMIT = 200

export async function fetchParcelCatalog(client, { limit = PARCELS_PUBLIC_LIMIT } = {}) {
  if (!client) return []
  const result = await client.from('parcels').select('*').order('created_at', { ascending: false }).limit(limit)
  return fromRows(rowsOrThrow(result, 'Colis'))
}

export async function fetchParcelRequests(client, userId, { limit = USER_ROWS_LIMIT } = {}) {
  if (!client || !userId) return []
  const result = await client.from('parcel_requests').select('*').eq('user_id', userId).limit(limit)
  return fromRows(rowsOrThrow(result, 'Demandes colis'))
}

/** Catalogue + décompte actifs / archivés identique à la page Colis web. */
export async function fetchParcelBrowse(client, options) {
  const items = await fetchParcelCatalog(client, options)
  return { items, counts: countBrowseParcelTabs(items) }
}
