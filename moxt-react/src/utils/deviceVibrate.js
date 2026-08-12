import { isNative } from '../platform/capacitor'

/** Pattern court mais perceptible (Android / WebView). */
const MENU_OPEN_VIBRATE_PATTERN = [24, 52, 32]

/**
 * Fait vibrer l'appareil à l'ouverture du menu d'actions message.
 * Capacitor natif → impact haptique ; sinon Vibration API du navigateur.
 */
export async function vibrateMenuOpen() {
  if (isNative) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      await Haptics.impact({ style: ImpactStyle.Medium })
      return
    } catch {
      // Plugin absent ou plateforme sans haptique — fallback ci-dessous.
    }
  }

  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return

  try {
    navigator.vibrate(MENU_OPEN_VIBRATE_PATTERN)
  } catch {
    // Permission ou API indisponible (ex. iOS Safari).
  }
}
