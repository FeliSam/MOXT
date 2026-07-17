import { useEffect, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/uiTranslations'
import { useLanguage } from '../../contexts/useLanguage'
import { updateAccountPreferences } from '../../features/account/accountSlice'

export function LanguagePicker({ className = '' }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.fr

  function selectLanguage(code) {
    if (code === language) {
      setOpen(false)
      return
    }
    setLanguage(code)
    if (user?.id) {
      dispatch(
        updateAccountPreferences({
          userId: user.id,
          preferences: { language: code },
        }),
      )
    }
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={`relative shrink-0 ${className}`} ref={ref}>
      <button
        type="button"
        className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 text-base leading-none transition hover:bg-[var(--app-surface-muted)] focus:border-[var(--app-teal)] focus:shadow-[0_0_0_3px_rgba(18,191,163,0.14)]"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('nav.languageAria', { language: current.label })}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span aria-hidden="true">{current.flag}</span>
        <FiChevronDown className="text-sm text-[var(--app-text-muted)]" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="panel-pop absolute right-0 top-[calc(100%+0.4rem)] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[var(--shadow-card-lg)]"
        >
          <div className="horizontal-track flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5">
            {SUPPORTED_LANGUAGES.map((code) => {
              const meta = LANGUAGE_LABELS[code] || { flag: '🏳️', label: code.toUpperCase() }
              const active = code === language
              return (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  aria-label={meta.label}
                  title={meta.label}
                  onClick={() => selectLanguage(code)}
                  className={`grid size-10 shrink-0 place-items-center rounded-xl text-lg leading-none transition ${
                    active
                      ? 'bg-[var(--app-accent-soft)] ring-2 ring-[var(--app-teal)] ring-offset-1 ring-offset-[var(--app-surface)]'
                      : 'hover:bg-[var(--app-surface-muted)]'
                  }`}
                >
                  {meta.flag}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
