import { useEffect, useRef } from 'react'

const SWIPE_THRESHOLD_PX = 72

function isMostlyVertical(deltaX, deltaY) {
  return Math.abs(deltaY) > Math.abs(deltaX) * 1.2
}

function isMostlyHorizontal(deltaX, deltaY) {
  return Math.abs(deltaX) > Math.abs(deltaY) * 1.2
}

function getSideZone(relativeX, width) {
  const third = width / 3
  if (relativeX < third) return 'left'
  if (relativeX > third * 2) return 'right'
  return 'center'
}

/**
 * Gestes viewer plein écran :
 * - swipe bas (image) → fermer
 * - swipe horizontal gauche/droite (zones latérales) → précédent / suivant
 *
 * Sans lockBody : le scroll vertical de la page reste libre.
 */
export function useSwipeDownToClose(
  onClose,
  enabled = true,
  targetKey = '',
  { onPrevious, onNext, lockBody = Boolean(onClose) } = {},
) {
  const swipeStartRef = useRef(null)
  const imageRef = useRef(null)
  const blockVerticalGesture = lockBody || Boolean(onClose)

  function getZone(start) {
    const el = imageRef.current
    if (!el || !start) return 'center'
    const rect = el.getBoundingClientRect()
    return getSideZone(start.x - rect.left, rect.width)
  }

  function handleImagePointerDown(event) {
    if (!enabled) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      captured: false,
    }
    if (lockBody) {
      event.currentTarget.setPointerCapture?.(event.pointerId)
      swipeStartRef.current.captured = true
    }
  }

  function handleImagePointerMove(event) {
    const start = swipeStartRef.current
    if (!start || start.pointerId !== event.pointerId) return

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    const zone = getZone(start)

    if (!blockVerticalGesture && Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (start.captured) {
        event.currentTarget.releasePointerCapture?.(event.pointerId)
      }
      swipeStartRef.current = null
      return
    }

    const shouldBlockHorizontal =
      zone !== 'center' && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)
    const shouldBlockVertical =
      blockVerticalGesture && deltaY > 8 && Math.abs(deltaY) > Math.abs(deltaX)

    if (shouldBlockHorizontal) {
      if (!start.captured) {
        event.currentTarget.setPointerCapture?.(event.pointerId)
        start.captured = true
      }
      event.preventDefault()
      return
    }

    if (shouldBlockVertical) {
      event.preventDefault()
    }
  }

  function handleImagePointerUp(event) {
    const start = swipeStartRef.current
    if (!start || start.pointerId !== event.pointerId) return
    swipeStartRef.current = null
    if (start.captured) {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    const zone = getZone(start)

    if (zone !== 'center' && isMostlyHorizontal(deltaX, deltaY)) {
      if (deltaX <= -SWIPE_THRESHOLD_PX) {
        onNext?.()
        return
      }
      if (deltaX >= SWIPE_THRESHOLD_PX) {
        onPrevious?.()
        return
      }
    }

    const isDownward = deltaY >= SWIPE_THRESHOLD_PX
    if (onClose && isDownward && isMostlyVertical(deltaX, deltaY)) {
      onClose()
    }
  }

  function handleImagePointerCancel(event) {
    const start = swipeStartRef.current
    if (start?.pointerId === event.pointerId) {
      if (start.captured) {
        event.currentTarget.releasePointerCapture?.(event.pointerId)
      }
      swipeStartRef.current = null
    }
  }

  useEffect(() => {
    if (!enabled) return undefined

    const previousOverflow = document.body.style.overflow
    const previousOverscroll = document.documentElement.style.overscrollBehavior
    if (lockBody) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overscrollBehavior = 'none'
    }

    function handleTouchMove(event) {
      const start = swipeStartRef.current
      if (!start) return
      const touch = event.touches[0]
      if (!touch) return

      const deltaX = touch.clientX - start.x
      const deltaY = touch.clientY - start.y
      const zone = getZone(start)

      if (!blockVerticalGesture && Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
        swipeStartRef.current = null
        return
      }

      const shouldBlockHorizontal =
        zone !== 'center' && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)
      const shouldBlockVertical =
        blockVerticalGesture && deltaY > 8 && Math.abs(deltaY) > Math.abs(deltaX)

      if ((shouldBlockHorizontal || shouldBlockVertical) && event.cancelable) {
        event.preventDefault()
      }
    }

    const containerEl = imageRef.current
    containerEl?.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      containerEl?.removeEventListener('touchmove', handleTouchMove)
      if (lockBody) {
        document.body.style.overflow = previousOverflow
        document.documentElement.style.overscrollBehavior = previousOverscroll
      }
    }
  }, [blockVerticalGesture, enabled, lockBody, targetKey])

  return {
    imageRef,
    imageSwipeHandlers: {
      onPointerDown: handleImagePointerDown,
      onPointerMove: handleImagePointerMove,
      onPointerUp: handleImagePointerUp,
      onPointerCancel: handleImagePointerCancel,
    },
  }
}
