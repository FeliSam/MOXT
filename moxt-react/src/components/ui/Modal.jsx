import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'

const sizes = {
  default: 'max-w-xl',
  large: 'max-w-3xl',
  wide: 'max-w-5xl',
}

export function Modal({ children, open, onClose, size = 'default', title, immersive = false }) {
  const { t } = useLanguage()
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.()
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open])

  if (!open) return null

  const modal = (
    <div
      className="fixed inset-0 z-[var(--z-modal)] grid place-items-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label={t('common.closeWindow')}
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        tabIndex={-1}
        className={`scrollbar-hidden relative z-10 max-h-[calc(100dvh-1.5rem)] min-w-0 w-full shadow-2xl sm:max-h-[92vh] ${sizes[size]} ${
          immersive
            ? 'overflow-hidden rounded-[2rem] border-0 bg-black p-0 pb-0 sm:p-0'
            : 'overflow-auto rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header
          className={
            immersive
              ? 'absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-4 bg-gradient-to-b from-black/75 via-black/35 to-transparent px-4 pb-8 pt-4 sm:px-6 sm:pt-5'
              : 'mb-5 flex items-center justify-between gap-4'
          }
        >
          <h2
            id={titleId}
            className={`text-lg font-black ${immersive ? 'text-white drop-shadow-sm' : ''}`}
          >
            {title}
          </h2>
          <button
            type="button"
            className={`grid size-9 place-items-center rounded-xl ${
              immersive
                ? 'bg-white/15 text-white backdrop-blur-sm hover:bg-white/25'
                : 'hover:bg-[var(--app-surface-muted)]'
            }`}
            aria-label={t('common.close')}
            onClick={onClose}
          >
            <FiX />
          </button>
        </header>
        {children}
      </section>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal
}
