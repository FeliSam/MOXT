import { useEffect, useRef, useState } from 'react'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/uiTranslations'

export function LanguagePicker({ language, setLanguage, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.fr

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
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        className="flex min-h-10 items-center gap-1.5 rounded-2xl px-2.5 text-xs font-black text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
        onClick={() => setOpen((v) => !v)}
        aria-label="Changer la langue"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{language.toUpperCase()}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="panel-pop absolute right-0 top-[calc(100%+0.4rem)] z-50 w-40 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-card-lg)]"
        >
          {SUPPORTED_LANGUAGES.map((code) => {
            const meta = LANGUAGE_LABELS[code] || { flag: '🏳️', label: code.toUpperCase() }
            const active = code === language
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLanguage(code)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                  active
                    ? 'bg-[var(--app-accent-soft)] text-brand-800 dark:text-brand-200'
                    : 'text-[var(--app-text-2)] hover:bg-[var(--app-surface-muted)]'
                }`}
              >
                <span className="text-base leading-none">{meta.flag}</span>
                {meta.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
