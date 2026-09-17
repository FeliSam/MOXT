import { useEffect, useRef } from 'react'
import { NATIVE_PAUSE_EVENT, NATIVE_RESUME_EVENT } from '../../platform/capacitor'
import { canFeedVideoAutoplay, subscribeFeedPlaybackAllowed } from './feedPlaybackSession'

export function primeFeedVideoElement(el) {
  if (!el) return
  el.playsInline = true
  el.setAttribute('playsinline', 'true')
  el.setAttribute('webkit-playsinline', 'true')
  el.setAttribute('preload', el.getAttribute('preload') || 'auto')
}

function pauseElement(el) {
  if (!el) return
  try {
    el.pause()
  } catch {
    /* ignore */
  }
}

/**
 * Lecture auto TikTok-style : play quand la slide est active, pause sinon.
 * Tente d’abord avec le mute global ; si le navigateur bloque (iOS), rejoue en muet.
 * Reprend au retour de background Capacitor / onglet UNIQUEMENT si le Fil est
 * encore au premier plan. Quitter le Fil, unmount, ou pause native arrête le son.
 */
export function useFeedVideoPlayback(videoRef, { active, muted, playbackUrl, videoId }) {
  const userPausedRef = useRef(false)

  useEffect(() => {
    userPausedRef.current = false
  }, [videoId, playbackUrl])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return undefined

    primeFeedVideoElement(el)

    if (!active) {
      pauseElement(el)
      return undefined
    }

    let cancelled = false

    function playNow() {
      if (cancelled || userPausedRef.current || !videoRef.current) return
      if (!canFeedVideoAutoplay()) return
      const node = videoRef.current
      primeFeedVideoElement(node)
      node.muted = muted

      const start = (forceMuted = false) => {
        if (forceMuted) node.muted = true
        const playResult = node.play()
        if (!playResult?.then) return Promise.resolve()
        return playResult.then(() => {
          if (!muted && forceMuted) node.muted = false
        })
      }

      start()
        .catch(() => {
          if (muted || cancelled) return undefined
          return start(true)
        })
        .catch(() => {
          /* autoplay bloqué — pas d’état pause forcé */
        })
    }

    function onForeground() {
      if (!canFeedVideoAutoplay()) return
      playNow()
    }

    function onVisibility() {
      if (!canFeedVideoAutoplay()) {
        pauseElement(videoRef.current)
        return
      }
      playNow()
    }

    let resumeTries = 0

    function onPause() {
      if (cancelled || userPausedRef.current) return
      if (!canFeedVideoAutoplay()) return
      if (resumeTries >= 4) return
      resumeTries += 1
      window.setTimeout(playNow, 60)
    }

    function onNativePause() {
      pauseElement(videoRef.current)
    }

    playNow()
    el.addEventListener('loadeddata', playNow)
    el.addEventListener('canplay', playNow)
    el.addEventListener('pause', onPause)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener(NATIVE_RESUME_EVENT, onForeground)
    window.addEventListener(NATIVE_PAUSE_EVENT, onNativePause)
    const unsubscribeAllowed = subscribeFeedPlaybackAllowed((allowed) => {
      if (allowed) onForeground()
      else pauseElement(videoRef.current)
    })

    return () => {
      cancelled = true
      el.removeEventListener('loadeddata', playNow)
      el.removeEventListener('canplay', playNow)
      el.removeEventListener('pause', onPause)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener(NATIVE_RESUME_EVENT, onForeground)
      window.removeEventListener(NATIVE_PAUSE_EVENT, onNativePause)
      unsubscribeAllowed()
      pauseElement(el)
    }
  }, [active, muted, playbackUrl, videoId, videoRef])

  return {
    pauseByUser() {
      userPausedRef.current = true
      pauseElement(videoRef.current)
    },
    resumeByUser() {
      userPausedRef.current = false
      const el = videoRef.current
      if (!el || !canFeedVideoAutoplay()) return
      el.muted = muted
      el.play()?.catch?.(() => {})
    },
    toggleMute(setMuted) {
      setMuted((value) => !value)
    },
  }
}
