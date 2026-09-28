import { fromRow } from '../utils/remoteRowMapper.js'

export function parseJsonObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

/** Ligne Supabase → camelCase, en fusionnant `payload` (colonnes réelles prioritaires), comme les mappers web. */
export function entityFromRemoteRow(row) {
  if (!row || typeof row !== 'object') return null
  const base = fromRow(row)
  const payload = parseJsonObject(row.payload)
  return { ...payload, ...base }
}

/** Renvoie `data` ou lève l’erreur Supabase (message lisible). */
export function rowsOrThrow(result, label) {
  if (result?.error) {
    const error = new Error(`${label}: ${result.error.message || 'erreur Supabase'}`)
    error.cause = result.error
    throw error
  }
  return result?.data || []
}

/** Comme le web (safeRows) : en cas d’erreur on garde une liste vide et on remonte l’erreur à part. */
export function rowsOrEmpty(result) {
  return result?.error ? [] : result?.data || []
}
