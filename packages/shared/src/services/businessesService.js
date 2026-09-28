import { entityFromRemoteRow, rowsOrEmpty, rowsOrThrow } from './rowUtils.js'
import { mergeRemoteById } from '../utils/mergeRemoteById.js'

export const BUSINESSES_PUBLIC_LIMIT = 50

/**
 * Ligne `businesses` → objet camelCase (payload + colonnes), version partagée simplifiée
 * de businessFromRemoteRow (web). Le nettoyage des comptes de transfert reste côté web.
 */
export function businessFromRemoteRow(row) {
  const base = entityFromRemoteRow(row)
  if (!base) return null
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {}
  return {
    ...base,
    ownerId: base.ownerId != null ? String(base.ownerId) : base.ownerId,
    deletedByUserAt: base.deletedByUserAt || payload.deletedByUserAt || null,
    hours: base.hours || payload.hours || base.scheduleSummary || '',
  }
}

/** Mêmes requêtes que le web : 50 plus récentes (RLS) + celles du compte. */
export async function fetchBusinesses(client, userId, { limit = BUSINESSES_PUBLIC_LIMIT } = {}) {
  if (!client) return []
  const [publicRes, ownedRes] = await Promise.all([
    client.from('businesses').select('*').order('created_at', { ascending: false }).limit(limit),
    userId ? client.from('businesses').select('*').eq('owner_id', userId) : Promise.resolve({ data: [] }),
  ])
  if (publicRes.error && (!userId || ownedRes.error)) rowsOrThrow(publicRes, 'Entreprises')
  const rows = [...rowsOrEmpty(publicRes), ...rowsOrEmpty(ownedRes)]
  return mergeRemoteById([], rows.map(businessFromRemoteRow).filter(Boolean))
}

export async function fetchBusinessById(client, businessId) {
  if (!client || !businessId) return null
  const result = await client.from('businesses').select('*').eq('id', businessId).maybeSingle()
  if (result.error) throw result.error
  return businessFromRemoteRow(result.data)
}

export async function fetchBusinessesByIds(client, ids = []) {
  const unique = [...new Set(ids.filter(Boolean).map(String))]
  if (!client || !unique.length) return []
  const result = await client.from('businesses').select('*').in('id', unique)
  return rowsOrThrow(result, 'Entreprises').map(businessFromRemoteRow).filter(Boolean)
}

export function findOwnedBusiness(businesses = [], userId) {
  return businesses.find((item) => item.ownerId === userId && !item.deletedByUserAt) || null
}
