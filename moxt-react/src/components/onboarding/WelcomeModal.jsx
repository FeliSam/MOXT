import { useEffect, useState } from 'react'
import {
  FiArrowRight,
  FiPackage,
  FiShoppingBag,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { isEmailVerified } from '@moxt/shared/auth/userSecurity.js'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

const SLIDE_COUNT = 3

export function WelcomeModal({ open, onClose, user }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (open) setSlide(0)
  }, [open])

  const needsEmail = Boolean(user?.email) && !isEmailVerified(user)
  const startTo = needsEmail ? '/security' : '/dashboard'
  const displayName = String(user?.firstName || '').trim() || 'MOXT'

  function finishAndGo(to = startTo) {
    onClose()
    navigate(to)
  }

  function handleNext() {
    if (slide >= SLIDE_COUNT - 1) {
      finishAndGo(startTo)
      return
    }
    setSlide((value) => value + 1)
  }

  return (
    <Modal open={open} onClose={onClose} title={p3('onboarding.title')} size="default">
      <div className="grid gap-5">
        {slide === 0 ? (
          <div className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(125deg,#07594d_0%,#08705f_48%,#245de8_100%)] p-5 text-white shadow-[0_24px_60px_rgb(7_89_77/0.22)] sm:p-6">
            <div className="absolute -right-16 -top-20 size-56 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-24 left-1/4 size-56 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold backdrop-blur">
                <FiStar />
                {p3('onboarding.slide1.eyebrow')}
              </div>
              <h3 className="font-display mt-4 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                {p3('onboarding.slide1.heading', { name: displayName })}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
                {p3('onboarding.slide1.body')}
              </p>
            </div>
          </div>
        ) : null}

        {slide === 1 ? (
          <div className="grid gap-3">
            <h3 className="font-display text-xl font-extrabold tracking-[-0.02em] text-[var(--app-text)]">
              {p3('onboarding.slide2.heading')}
            </h3>
            <ul className="grid gap-3">
              {[
                { icon: FiTrendingUp, text: p3('onboarding.slide2.transfers'), tone: 'bg-brand-700' },
                { icon: FiPackage, text: p3('onboarding.slide2.parcels'), tone: 'bg-amber-600' },
                {
                  icon: FiShoppingBag,
                  text: p3('onboarding.slide2.marketplace'),
                  tone: 'bg-blue-600',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.text}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5"
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl text-white ${item.tone}`}
                    >
                      <Icon />
                    </span>
                    <p className="pt-1.5 text-sm leading-6 text-[var(--app-text)]">{item.text}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {slide === 2 ? (
          <div className="grid gap-3">
            <h3 className="font-display text-xl font-extrabold tracking-[-0.02em] text-[var(--app-text)]">
              {p3('onboarding.slide3.heading')}
            </h3>
            <p className="text-sm leading-7 text-[var(--app-text-muted)]">
              {needsEmail ? p3('onboarding.slide3.bodyEmail') : p3('onboarding.slide3.body')}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-1.5" aria-hidden>
          {Array.from({ length: SLIDE_COUNT }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === slide ? 'w-6 bg-brand-700' : 'w-1.5 bg-[var(--app-border-md)]'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {p3('onboarding.later')}
          </Button>
          <Button type="button" icon={FiArrowRight} onClick={handleNext}>
            {slide >= SLIDE_COUNT - 1 ? p3('onboarding.start') : p3('onboarding.next')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
