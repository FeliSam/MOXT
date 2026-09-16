import { useEffect, useRef } from 'react'
import { NATIVE_RESUME_EVENT } from '../../platform/capacitor'

export function primeFeedVideoElement(el) {
  if (!el) return
  el.playsInline = true
  el.setAttribute('playsinline', 'true')
  el.setAttribute('webkit-playsinline', 'true')
  el.setAttribute('preload', el.getAttribute('preload') || 'auto')
}

/**
 * Lecture auto TikTok-style : play quand la slide est active, pause sinon.
 * Tente d’abord avec le mute global ; si le navigateur bloque (iOS), rejoue en muet.
 * Reprend aussi au retour de background Capacitor / onglet.
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
      el.pause()
      return undefined
    }

    let cancelled = false

    function playNow() {
      if (cancelled || userPausedRef.current || !videoRef.current) return
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
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      playNow()
    }

    playNow()
    el.addEventListener('loadeddata', playNow)
    el.addEventListener('canplay', playNow)
    document.addEventListener('visibilitychange', onForeground)
    window.addEventListener(NATIVE_RESUME_EVENT, onForeground)

    return () => {
      cancelled = true
      el.removeEventListener('loadeddata', playNow)
      el.removeEventListener('canplay', playNow)
      document.removeEventListener('visibilitychange', onForeground)
      window.removeEventListener(NATIVE_RESUME_EVENT, onForeground)
    }
  }, [active, muted, playbackUrl, videoId, videoRef])

  return {
    pauseByUser() {
      userPausedRef.current = true
      videoRef.current?.pause()
    },
    resumeByUser() {
      userPausedRef.current = false
      const el = videoRef.current
      if (!el) return
      el.muted = muted
      el.play()?.catch?.(() => {})
    },
    toggleMute(setMuted) {
      setMuted((value) => !value)
    },
  }
}
