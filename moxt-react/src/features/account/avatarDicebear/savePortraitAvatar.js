import { findPortrait, serializePortraitPreferences } from './portraitOptions.js'
import { profileDetailsFromUser } from './saveDicebearAvatar.js'

export { profileDetailsFromUser }

/**
 * Enregistre un portrait de la bibliothèque : profiles.avatar_url = URL CDN du portrait
 * (aucun upload, aucun rendu canvas) puis profiles.preferences.avatarPortrait.
 * Dépendances injectées pour rester testable.
 */
export async function savePortraitAvatar({ user, choice, persistProfile, persistPreferences }) {
  if (!user?.id) throw new Error('Session expirée.')
  const portrait = findPortrait(choice)
  if (!portrait) throw new Error('Portrait introuvable.')
  const avatarUrl = portrait.url
  const preferences = serializePortraitPreferences(choice)
  const saved = await persistProfile(profileDetailsFromUser(user, { avatarUrl }))
  // Préférences best-effort : avatar_url reste la source de vérité (restaurable depuis l’URL).
  try {
    await persistPreferences(preferences)
  } catch {
    /* ignore */
  }
  return { avatarUrl, preferences, saved }
}
