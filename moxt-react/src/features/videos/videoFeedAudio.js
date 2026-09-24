import { useCallback, useEffect, useState } from 'react'

/**
 * Son du Fil vidéo — partagé entre slides.
 *
 * Défaut produit : son ON (unmuted). Les navigateurs (surtout iOS Safari) peuvent
 * bloquer l’autoplay avec son : useFeedVideoPlayback démarre alors en muet puis
 * tente unmute ; le bouton volume reste disponible. L’admin peut forcer muet via
 * app_feed_playback.soundOnByDefault.
 */
let feedMuted = false
let userOverride = false
const listeners = new Set()

export function getVideoFeedMuted() {
  return feedMuted
}

export function setVideoFeedMuted(next, options = {}) {
  const fromUser = options.fromUser !== false
  const value = typeof next === 'function' ? next(feedMuted) : Boolean(next)
  if (fromUser) userOverride = true
  if (value === feedMuted) return
  feedMuted = value
  listeners.forEach((listener) => listener(feedMuted))
}

/** Applique le défaut admin tant que l’utilisateur n’a pas touché au volume. */
export function applyFeedPlaybackDefaults(config = {}) {
  if (userOverride) return
  const soundOn = config.soundOnByDefault !== false
  setVideoFeedMuted(!soundOn, { fromUser: false })
}

export function subscribeVideoFeedMuted(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useVideoFeedMuted() {
  const [muted, setMutedState] = useState(getVideoFeedMuted)

  useEffect(() => subscribeVideoFeedMuted(setMutedState), [])

  const setMuted = useCallback((next) => {
    setVideoFeedMuted(next, { fromUser: true })
  }, [])

  return [muted, setMuted]
}
