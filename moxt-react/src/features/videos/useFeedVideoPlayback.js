import { useEffect, useRef } from 'react'

/**
 * Lecture auto TikTok-style : play quand la slide est active, pause sinon.
 * Tente d’abord avec le mute global ; si le navigateur bloque, rejoue en muet puis réapplique le son.
 */
export function useFeedVideoPlayback(videoRef, { active, muted, playbackUrl, videoId }) {
  const userPausedRef = useRef(false)

  useEffect(() => {
    userPausedRef.current = false
  }, [videoId, playbackUrl])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return undefined

    if (!active) {
      el.pause()
      return undefined
    }

    let cancelled = false

    function playNow() {
      if (cancelled || userPausedRef.current || !videoRef.current) return
      const node = videoRef.current
      node.muted = muted

      const start = (forceMuted = false) => {
        if (forceMuted) node.muted = true
        return node.play()?.then?.(() => {
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

    playNow()
    el.addEventListener('loadeddata', playNow)
    el.addEventListener('canplay', playNow)

    return () => {
      cancelled = true
      el.removeEventListener('loadeddata', playNow)
      el.removeEventListener('canplay', playNow)
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
