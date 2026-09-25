import { serializeLoreleiPreferences } from './loreleiOptions.js'

/** Détails attendus par authService.updateProfile, dérivés de l’utilisateur courant. */
export function profileDetailsFromUser(user, overrides = {}) {
  const u = user || {}
  return {
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    avatarUrl: u.avatarUrl || '',
    phone: u.phone || '',
    secondaryPhone: u.secondaryPhone || '',
    country: u.country || 'RU',
    originCountry: u.originCountry || '',
    city: u.city || '',
    ...overrides,
  }
}

/**
 * Pipeline d’enregistrement : SVG → PNG → upload média (Yandex via media-api)
 * → profiles.avatar_url → profiles.preferences.avatarDicebear.
 * Dépendances injectées pour rester testable.
 */
export async function saveDicebearAvatar({
  user,
  options,
  renderPng,
  uploadAvatar,
  persistProfile,
  persistPreferences,
  onProgress,
}) {
  if (!user?.id) throw new Error('Session expirée.')
  const file = await renderPng(options)
  const avatarUrl = await uploadAvatar(user.id, file, { onProgress })
  if (!avatarUrl) throw new Error('Upload sans URL.')
  const preferences = serializeLoreleiPreferences(options, { avatarUrl })
  const saved = await persistProfile(profileDetailsFromUser(user, { avatarUrl }))
  // Les préférences sont best-effort : l’URL CDN reste la source de vérité.
  try {
    await persistPreferences(preferences)
  } catch {
    /* ignore */
  }
  return { avatarUrl, preferences, saved }
}
