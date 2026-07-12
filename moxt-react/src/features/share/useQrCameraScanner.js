import { useCallback, useEffect, useRef, useState } from 'react'

function stopVideoStream(videoEl) {
  if (!videoEl) return
  const stream = videoEl.srcObject
  if (stream && typeof stream.getTracks === 'function') {
    stream.getTracks().forEach((track) => track.stop())
  }
  videoEl.srcObject = null
}

/**
 * Active la caméra uniquement quand `enabled` est vrai et libère les pistes à l'arrêt.
 */
export function useQrCameraScanner({ enabled, videoRef, onDecode }) {
  const controlsRef = useRef(null)
  const readerRef = useRef(null)
  const handledRef = useRef(false)
  const sessionRef = useRef(0)
  const onDecodeRef = useRef(onDecode)
  const [status, setStatus] = useState('idle')

  onDecodeRef.current = onDecode

  const stop = useCallback(() => {
    sessionRef.current += 1
    controlsRef.current?.stop()
    controlsRef.current = null
    readerRef.current = null
    stopVideoStream(videoRef.current)
    setStatus((current) => (current === 'denied' ? 'denied' : 'idle'))
  }, [videoRef])

  const start = useCallback(async () => {
    if (!enabled || !videoRef.current || handledRef.current) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }

    const session = sessionRef.current + 1
    sessionRef.current = session
    setStatus('starting')

    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser')
      if (session !== sessionRef.current || !enabled || !videoRef.current) return

      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 180,
        delayBetweenScanSuccess: 1500,
      })
      readerRef.current = reader

      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        videoRef.current,
        (result, error) => {
          if (session !== sessionRef.current) return
          if (error?.name === 'NotFoundException') return
          if (!result || handledRef.current) return

          const text = result.getText()?.trim()
          if (!text) return

          handledRef.current = true
          controlsRef.current?.stop()
          controlsRef.current = null
          stopVideoStream(videoRef.current)
          setStatus('idle')
          onDecodeRef.current(text)
        },
      )

      if (session !== sessionRef.current) {
        controls.stop()
        return
      }

      controlsRef.current = controls
      setStatus('scanning')
    } catch (error) {
      if (session !== sessionRef.current) return
      const name = error?.name || ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setStatus('denied')
      } else {
        setStatus('error')
      }
      stop()
    }
  }, [enabled, stop, videoRef])

  const restart = useCallback(() => {
    handledRef.current = false
    sessionRef.current += 1
    controlsRef.current?.stop()
    controlsRef.current = null
    readerRef.current = null
    stopVideoStream(videoRef.current)
    setStatus('idle')
    if (enabled) start()
  }, [enabled, start, videoRef])

  useEffect(() => {
    if (!enabled) {
      handledRef.current = false
      stop()
      return undefined
    }

    start()
    return () => {
      handledRef.current = false
      stop()
    }
  }, [enabled, start, stop])

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stop()
        return
      }
      if (enabled && !handledRef.current) {
        start()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [enabled, start, stop])

  return { status, restart, stop }
}
