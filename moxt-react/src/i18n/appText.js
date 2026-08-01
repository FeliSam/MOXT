import { ensureLocaleLoaded, translate } from './translate'

const FALLBACK_LANGUAGE = 'fr'
const STORAGE_KEY = 'moxt-language'

/** Active UI language outside React (middleware, non-component helpers). */
export function resolveAppLanguage() {
  try {
    const fromDocument =
      typeof globalThis !== 'undefined'
        ? globalThis.document?.documentElement?.lang
        : undefined
    const normalizedDoc = String(fromDocument || '').trim().toLowerCase()
    if (normalizedDoc) return normalizedDoc.split('-')[0]

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return String(stored).trim().toLowerCase().split('-')[0]
    }
  } catch {
    // ignore storage / document access errors
  }
  return FALLBACK_LANGUAGE
}

/** Keyed translation using the current document / storage language. */
export function appText(key, vars) {
  const language = resolveAppLanguage()
  // Filet de sécurité : la langue est normalement déjà chargée par
  // LanguageProvider, mais on déclenche aussi ici (idempotent, mis en cache)
  // au cas où ce helper serait appelé avant que React n'ait monté.
  void ensureLocaleLoaded(language)
  return translate(language, key, vars)
}
