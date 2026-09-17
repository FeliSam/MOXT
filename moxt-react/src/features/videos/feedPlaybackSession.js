import { pauseAllDocumentMedia } from '../../platform/mediaPlayback'

let allowed = true
const listeners = new Set()

export function isFeedPlaybackAllowed() {
  return allowed
}

export function setFeedPlaybackAllowed(next) {
  const value = Boolean(next)
  if (value === allowed) {
    if (!value) pauseAllDocumentMedia()
    return
  }
  allowed = value
  if (!allowed) pauseAllDocumentMedia()
  listeners.forEach((listener) => listener(allowed))
}

export function subscribeFeedPlaybackAllowed(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function canFeedVideoAutoplay() {
  if (!allowed) return false
  if (typeof document === 'undefined') return true
  if (document.visibilityState === 'hidden') return false
  if (document.documentElement.classList.contains('capacitor-paused')) return false
  return true
}

export function resetFeedPlaybackAllowed() {
  allowed = true
}
