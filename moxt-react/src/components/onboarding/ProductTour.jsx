import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiArrowRight, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { isEmailVerified } from '@moxt/shared/auth/userSecurity.js'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { delay, setTourMoreOpen } from '../../features/onboarding/tourChrome'
import { inflateRect, measureTourTarget, placeTourCard } from '../../features/onboarding/tourGeometry'
import { getTourSteps, TOUR_DESKTOP_MQ } from '../../features/onboarding/tourSteps'
import { Button } from '../ui/Button'

const CARD_WIDTH = 340
const MORE_OPEN_DELAY_MS = 320

function useTourVariant() {
  const [variant, setVariant] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(TOUR_DESKTOP_MQ).matches
      ? 'desktop'
      : 'mobile',
  )

  useEffect(() => {
    const mq = window.matchMedia(TOUR_DESKTOP_MQ)
    const onChange = () => setVariant(mq.matches ? 'desktop' : 'mobile')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return variant
}

/**
 * Premium product tour — spotlight presentation of chrome (mobile ≠ desktop).
 */
export function ProductTour({ open, onClose, user }) {
  const variant = useTourVariant()
  if (!open || typeof document === 'undefined') return null
  return (
    <ProductTourSession
      key={variant}
      variant={variant}
      onClose={onClose}
      user={user}
    />
  )
}

function ProductTourSession({ variant, onClose, user }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const steps = getTourSteps(variant)
  const [index, setIndex] = useState(0)
  const [hole, setHole] = useState(null)
  const [cardPos, setCardPos] = useState({ top: 0, left: 0, width: CARD_WIDTH, arrow: null })
  const [layoutReady, setLayoutReady] = useState(0)
  const cardRef = useRef(null)
  const closingRef = useRef(false)

  const step = steps[Math.min(index, steps.length - 1)]
  const isLast = index >= steps.length - 1
  const displayName = String(user?.firstName || '').trim() || 'MOXT'
  const needsEmail = Boolean(user?.email) && !isEmailVerified(user)
  const finishTo = needsEmail ? '/security?verify=email' : '/dashboard'

  useEffect(() => {
    let cancelled = false

    async function prepareChrome() {
      if (step.more === 'open') {
        setTourMoreOpen(true)
        await delay(MORE_OPEN_DELAY_MS)
      } else {
        setTourMoreOpen(false)
        if (step.more === 'close') await delay(160)
      }
      if (!cancelled) setLayoutReady((value) => value + 1)
    }

    prepareChrome()
    return () => {
      cancelled = true
    }
  }, [step, index, variant])

  useLayoutEffect(() => {
    if (!step) return undefined

    function sync() {
      const measured = measureTourTarget(step.selector)
      const nextHole = measured ? inflateRect(measured.rect, step.pad ?? 8) : null
      setHole(nextHole)

      const cardRect = cardRef.current?.getBoundingClientRect()
      const cardSize = {
        width: CARD_WIDTH,
        height: cardRect?.height || 220,
      }
      const placement = nextHole ? step.placement || 'auto' : 'center'
      setCardPos(placeTourCard(nextHole, placement, cardSize))
    }

    sync()
    const raf = requestAnimationFrame(sync)
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
    }
  }, [step, index, variant, layoutReady])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('moxt-tour-active')
    window.scrollTo({ top: 0, left: 0 })
    return () => {
      document.body.style.overflow = prev
      document.body.classList.remove('moxt-tour-active')
      setTourMoreOpen(false)
    }
  }, [])

  useEffect(() => {
    function onKey(event) {
      if (closingRef.current) return
      if (event.key === 'Escape') {
        event.preventDefault()
        if (closingRef.current) return
        closingRef.current = true
        setTourMoreOpen(false)
        onClose()
      } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault()
        if (index >= steps.length - 1) {
          if (closingRef.current) return
          closingRef.current = true
          setTourMoreOpen(false)
          onClose()
          navigate(finishTo)
          return
        }
        setIndex((value) => value + 1)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finishTo, index, navigate, onClose, steps.length])

  function finish(navigateTo = null) {
    if (closingRef.current) return
    closingRef.current = true
    setTourMoreOpen(false)
    onClose()
    if (navigateTo) navigate(navigateTo)
  }

  function handleNext() {
    if (isLast) {
      finish(finishTo)
      return
    }
    setIndex((value) => value + 1)
  }

  function handleSkip() {
    finish()
  }

  const progress = ((index + 1) / steps.length) * 100
  const title = p3(step.titleKey, { name: displayName })
  const bodyKey =
    step.id === 'done' && needsEmail ? 'onboarding.tour.done.bodyEmail' : step.bodyKey
  const body = p3(bodyKey, { name: displayName })
  const radius = step.radius ?? 16

  return createPortal(
    <div
      className="moxt-tour moxt-tour--visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="moxt-tour-title"
      aria-describedby="moxt-tour-body"
      data-variant={variant}
    >
      {!hole ? <div className="moxt-tour-scrim" aria-hidden="true" /> : null}

      {hole ? (
        <div
          className="moxt-tour-spotlight"
          aria-hidden="true"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            borderRadius: radius,
          }}
        >
          <span className="moxt-tour-spotlight-ring" style={{ borderRadius: radius }} />
        </div>
      ) : null}

      <div
        ref={cardRef}
        className={`moxt-tour-card ${hole ? 'moxt-tour-card--anchored' : 'moxt-tour-card--center'}`}
        style={{
          top: cardPos.top,
          left: cardPos.left,
          width: cardPos.width,
        }}
      >
        <div className="moxt-tour-card-glow" aria-hidden="true" />

        <div className="moxt-tour-card-top">
          <span className="moxt-tour-eyebrow">{p3('onboarding.tour.eyebrow')}</span>
          <button
            type="button"
            className="moxt-tour-skip-icon btn-press"
            onClick={handleSkip}
            aria-label={p3('onboarding.skip')}
          >
            <FiX strokeWidth={2.2} />
          </button>
        </div>

        <div className="moxt-tour-progress" aria-hidden="true">
          <span className="moxt-tour-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <p className="moxt-tour-stepcount">
          {p3('onboarding.tour.stepOf', { current: index + 1, total: steps.length })}
        </p>

        <h2 id="moxt-tour-title" className="moxt-tour-title font-display">
          {title}
        </h2>
        <p id="moxt-tour-body" className="moxt-tour-body">
          {body}
        </p>

        <div className="moxt-tour-actions">
          <Button type="button" variant="ghost" size="sm" onClick={handleSkip}>
            {p3('onboarding.skip')}
          </Button>
          <Button type="button" size="sm" iconRight={FiArrowRight} onClick={handleNext}>
            {isLast
              ? needsEmail
                ? p3('onboarding.tour.secure')
                : p3('onboarding.start')
              : p3('onboarding.next')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
