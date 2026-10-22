/**
 * Profil public d'un membre (table `profiles`), comme
 * moxt-react/src/features/publications/usePublicationProfile.js : seules la bannière
 * (`preferences.coverStyle`) et le genre sont repris des préférences.
 */
const BASE_COLUMNS = 'first_name, last_name, city, country, avatar_url, status, created_at, updated_at'

export function genderFromPreferences(preferences) {
  return preferences?.gender || preferences?.avatarDicebear?.preferences?.gender || null
}

export function mapRemoteProfile(row) {
  if (!row) return null
  return {
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    city: row.city || '',
    country: row.country || '',
    avatarUrl: row.avatar_url || null,
    verified: row.status === 'verified',
    memberSince: row.created_at || row.updated_at || null,
    coverStyle: row.preferences?.coverStyle || null,
    gender: genderFromPreferences(row.preferences),
  }
}

/** Lit le profil ; si la colonne `preferences` n'est pas lisible, retombe sur les colonnes de base. */
export async function fetchPublicProfile(client, userId) {
  if (!client || !userId) return null
  const query = (columns) => client.from('profiles').select(columns).eq('id', userId).maybeSingle()
  let result = await query(`${BASE_COLUMNS}, preferences`)
  if (result.error) result = await query(BASE_COLUMNS)
  if (result.error) throw result.error
  return mapRemoteProfile(result.data)
}
