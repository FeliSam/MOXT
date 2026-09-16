/** iOS WKWebView often emits a spurious `offline` while sleeping. Wait before blocking UI. */
export const OFFLINE_CONFIRM_MS = 700

export function shouldIgnoreOfflineSignal({
  visibilityState = typeof document !== 'undefined' ? document.visibilityState : 'visible',
} = {}) {
  return visibilityState === 'hidden'
}

export function shouldCloseNetworkModal({
  onLine = typeof navigator === 'undefined' ? true : navigator.onLine,
} = {}) {
  return onLine !== false
}
