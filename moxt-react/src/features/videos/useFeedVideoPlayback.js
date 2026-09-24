import { useEffect, useRef } from 'react'
import { NATIVE_PAUSE_EVENT, NATIVE_RESUME_EVENT } from '../../platform/capacitor'
import { canFeedVideoAutoplay, subscribeFeedPlaybackAllowed } from './feedPlaybackSession'

/** HAVE_CURRENT_DATA — enough to attempt play without waiting forever. */
const HAVE_CURRENT_DATA = 2

/** While active, re-check paused+ready media at this interval (success: unstick <~2s). */
export const FEED_PLAY_WATCHDOG_MS = 400

export function primeFeedVideoElement(el) {
  if (!el) return
  el.playsInline = true
  el.setAttribute('playsinline', 'true')
  el.setAttribute('webkit-playsinline', 'true')
  el.setAttribute('preload', el.getAttribute('preload') || 'auto')
  // iOS WKWebView: defaultMuted helps the first attribute-based autoplay gesture gate.
  if (typeof el.defaultMuted === 'boolean') el.defaultMuted = true
}

function pauseElement(el) {
  if (!el) return
  try {
    el.pause()
  } catch {
    /* ignore */
  }
}

function isActivelyPlaying(node) {
  return Boolean(node && !node.paused && !node.ended)
}

/**
 * Lecture auto TikTok-style : play quand la slide est active, pause sinon.
 * Tente d’abord avec le mute global ; si le navigateur bloque (iOS), rejoue en muet.
 * Reprend au retour de background Capacitor / onglet UNIQUEMENT si le Fil est
 * encore au premier plan. Quitter le Fil, unmount, ou pause native arrête le son.
 *
 * Watchdog: if the active card stays paused while media is ready (readyState≥2),
 * keep calling play() — covers aborted initial play() when canplay already fired.
 */
export function useFeedVideoPlayback(videoRef, { active, muted, playbackUrl, videoId, videoEl = null }) {
  const userPausedRef = useRef(false)

  useEffect(() => {
    userPausedRef.current = false
  }, [videoId, playbackUrl])

  useEffect(() => {
    const el = videoEl || videoRef.current
    if (!el) return undefined

    // Keep ref in sync when the caller passes the attached node explicitly.
    if (videoRef && videoRef.current !== el) videoRef.current = el

    primeFeedVideoElement(el)

    if (!active) {
      pauseElement(el)
      return undefined
    }

    let cancelled = false
    let playInFlight = false
    let retryTimer = 0
    let watchdogTimer = 0

    function clearRetry() {
      if (retryTimer) {
        window.clearTimeout(retryTimer)
        retryTimer = 0
      }
    }

    function scheduleRetry(delayMs = 80) {
      clearRetry()
      if (cancelled || userPausedRef.current) return
      retryTimer = window.setTimeout(() => {
        retryTimer = 0
        playNow()
      }, delayMs)
    }

    function playNow() {
      if (cancelled || userPausedRef.current || !videoRef.current) return
      if (!canFeedVideoAutoplay()) return
      const node = videoRef.current
      if (isActivelyPlaying(node)) return
      if (playInFlight) return

      primeFeedVideoElement(node)
      node.muted = Boolean(muted)

      const start = (forceMuted = false) => {
        if (forceMuted) node.muted = true
        const playResult = node.play()
        if (!playResult?.then) return Promise.resolve()
        return playResult.then(() => {
          if (!muted && forceMuted && !cancelled && videoRef.current === node) {
            node.muted = false
          }
        })
      }

      playInFlight = true
      start()
        .catch(() => {
          if (cancelled || userPausedRef.current) return undefined
          // Unmuted blocked (or aborted) — retry muted once.
          if (!muted) return start(true)
          return undefined
        })
        .catch(() => {
          /* autoplay still blocked — events + watchdog retry while active */
        })
        .finally(() => {
          playInFlight = false
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

    function onPlaying() {
      clearRetry()
    }

    function onPause() {
      if (cancelled || userPausedRef.current) return
      if (!canFeedVideoAutoplay()) return
      // Soft resume — no hard try cap; watchdog covers long stalls.
      scheduleRetry(60)
    }

    function onNativePause() {
      pauseElement(videoRef.current)
    }

    function tickWatchdog() {
      if (cancelled || userPausedRef.current) return
      if (!canFeedVideoAutoplay()) return
      const node = videoRef.current
      if (!node || isActivelyPlaying(node) || playInFlight) return
      // Media ready (or at least has a frame) but still paused → force play.
      if (node.readyState >= HAVE_CURRENT_DATA) playNow()
      else if (node.readyState >= 1) playNow()
    }

    playNow()
    el.addEventListener('loadeddata', playNow)
    el.addEventListener('canplay', playNow)
    el.addEventListener('canplaythrough', playNow)
    el.addEventListener('playing', onPlaying)
    el.addEventListener('pause', onPause)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener(NATIVE_RESUME_EVENT, onForeground)
    window.addEventListener(NATIVE_PAUSE_EVENT, onNativePause)
    const unsubscribeAllowed = subscribeFeedPlaybackAllowed((allowed) => {
      if (allowed) onForeground()
      else pauseElement(videoRef.current)
    })
    watchdogTimer = window.setInterval(tickWatchdog, FEED_PLAY_WATCHDOG_MS)

    return () => {
      cancelled = true
      clearRetry()
      if (watchdogTimer) window.clearInterval(watchdogTimer)
      el.removeEventListener('loadeddata', playNow)
      el.removeEventListener('canplay', playNow)
      el.removeEventListener('canplaythrough', playNow)
      el.removeEventListener('playing', onPlaying)
      el.removeEventListener('pause', onPause)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener(NATIVE_RESUME_EVENT, onForeground)
      window.removeEventListener(NATIVE_PAUSE_EVENT, onNativePause)
      unsubscribeAllowed()
      pauseElement(el)
    }
  }, [active, muted, playbackUrl, videoId, videoRef, videoEl])

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
