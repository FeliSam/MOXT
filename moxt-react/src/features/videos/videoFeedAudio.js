import { useCallback, useEffect, useState } from 'react'

/** Son du fil vidéo — conservé entre les slides (pas réinitialisé à chaque vidéo). */
let feedMuted = true
const listeners = new Set()

export function getVideoFeedMuted() {
  return feedMuted
}

export function setVideoFeedMuted(next) {
  const value = typeof next === 'function' ? next(feedMuted) : Boolean(next)
  if (value === feedMuted) return
  feedMuted = value
  listeners.forEach((listener) => listener(feedMuted))
}

export function subscribeVideoFeedMuted(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useVideoFeedMuted() {
  const [muted, setMutedState] = useState(getVideoFeedMuted)

  useEffect(() => subscribeVideoFeedMuted(setMutedState), [])

  const setMuted = useCallback((next) => {
    setVideoFeedMuted(next)
  }, [])

  return [muted, setMuted]
}
