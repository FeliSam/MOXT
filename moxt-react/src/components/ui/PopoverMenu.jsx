import { useEffect, useId, useRef, useState } from 'react'

export function PopoverMenu({ ariaLabel, children, className = '', trigger }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open || !rootRef.current) return
    const menu = rootRef.current.querySelector('[role="menu"]')
    const first = menu?.querySelector('button, [href], [tabindex]:not([tabindex="-1"])')
    first?.focus()
  }, [open])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className="contents"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="panel-pop absolute right-0 top-[calc(100%+0.4rem)] z-30 grid min-w-44 gap-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-card-lg)]"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
