import { isNative } from './capacitor'

/** @returns {'granted'|'denied'|'prompt'|null} null si non natif ou plugin indisponible */
export async function queryNativeCameraPermission() {
  if (!isNative) return null

  try {
    const { Camera } = await import('@capacitor/camera')
    const status = await Camera.checkPermissions()
    if (status.camera === 'granted') return 'granted'
    if (status.camera === 'denied') return 'denied'
    return 'prompt'
  } catch {
    return null
  }
}

/**
 * Demande la permission caméra via l’API native Capacitor (Android / iOS).
 * @returns {{ granted: boolean, reason?: string, error?: unknown }|null}
 */
export async function requestNativeCameraPermission() {
  if (!isNative) return null

  try {
    const { Camera } = await import('@capacitor/camera')
    const status = await Camera.requestPermissions({ permissions: ['camera'] })
    if (status.camera === 'granted') return { granted: true }
    if (status.camera === 'denied') return { granted: false, reason: 'denied' }
    return { granted: false, reason: 'prompt' }
  } catch (error) {
    return { granted: false, reason: 'error', error }
  }
}
