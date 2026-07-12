/**
 * État de permission caméra pour le scanner QR.
 * @returns {'granted'|'denied'|'prompt'|'unsupported'}
 */
export async function queryCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported'

  try {
    if (navigator.permissions?.query) {
      const result = await navigator.permissions.query({ name: 'camera' })
      return result.state
    }
  } catch {
    /* Safari / WebView : Permissions API parfois indisponible pour "camera" */
  }

  return 'prompt'
}

/**
 * Demande l'accès caméra (autorisation navigateur / OS).
 * Libère immédiatement le flux après accord — le scanner rouvrira sa propre session.
 */
export async function requestCameraAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { granted: false, reason: 'unsupported' }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    stream.getTracks().forEach((track) => track.stop())
    return { granted: true }
  } catch (error) {
    const name = error?.name || ''
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return { granted: false, reason: 'denied' }
    }
    return { granted: false, reason: 'error', error }
  }
}
