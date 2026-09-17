/**
 * Pause every media element in the WebView.
 * Required on Capacitor/iOS: removing a <video> from the DOM does not always
 * stop WKWebView audio, so callers must pause before unmount / route leave.
 */
export function pauseAllDocumentMedia(root = typeof document !== 'undefined' ? document : null) {
  if (!root?.querySelectorAll) return 0
  let paused = 0
  root.querySelectorAll('video, audio').forEach((el) => {
    try {
      el.pause()
      paused += 1
    } catch {
      /* ignore */
    }
  })
  return paused
}
