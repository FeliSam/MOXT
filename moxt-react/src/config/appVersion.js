import { getLocalBuildId } from '../services/appUpdate'

export const APP_VERSION =
  typeof __MOXT_APP_VERSION__ !== 'undefined' ? __MOXT_APP_VERSION__ : '0.0.0'

const LOCALE_BY_LANGUAGE = {
  en: 'en-US',
  fr: 'fr-FR',
  pt: 'pt-PT',
  ru: 'ru-RU',
}

export function formatBuildDate(iso, locale) {
  if (!iso) return null
  const resolved =
    LOCALE_BY_LANGUAGE[String(locale || '').toLowerCase()] || locale || 'fr-FR'
  try {
    return new Intl.DateTimeFormat(resolved, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export async function fetchAppReleaseInfo(fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`/version.json?ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const payload = await response.json()
    return {
      version: payload.version || APP_VERSION,
      buildId: payload.buildId || getLocalBuildId(),
      builtAt: payload.builtAt || null,
      channel: payload.channel || 'production',
    }
  } catch {
    return {
      version: APP_VERSION,
      buildId: getLocalBuildId(),
      builtAt: null,
      channel: 'production',
    }
  }
}
