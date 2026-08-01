import { Capacitor } from '@capacitor/core'

/** URL publique canonique (partages, QR, e-mails, SEO). */
export const CANONICAL_SITE_URL = 'https://moxtapp.ru'

function isLocalOrCapacitorOrigin(origin) {
  if (!origin) return true
  try {
    const { hostname } = new URL(origin)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local') ||
      hostname === 'capacitor' ||
      hostname === 'android' ||
      // Capacitor Android androidScheme:https → https://localhost
      (hostname === 'localhost' && Capacitor?.isNativePlatform?.())
    )
  } catch {
    return false
  }
}

/**
 * URL du site pour liens absolus partagés.
 * Sur l’app native (assets locaux), window.location.origin vaut souvent
 * https://localhost — on renvoie alors moxtapp.ru pour les liens publics.
 */
export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured) return String(configured).replace(/\/$/, '')

  try {
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform?.()) {
      return CANONICAL_SITE_URL
    }
  } catch {
    /* Capacitor indisponible hors runtime navigateur */
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin
    if (isLocalOrCapacitorOrigin(origin)) return CANONICAL_SITE_URL
    return origin.replace(/\/$/, '')
  }

  return CANONICAL_SITE_URL
}

export function buildAbsoluteUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${normalized}`
}
