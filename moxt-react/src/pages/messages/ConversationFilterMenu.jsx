import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiArchive, FiCheck, FiFilter, FiStar } from 'react-icons/fi'
import { countConversationsForFilter } from './messageUtils'

const FILTER_OPTIONS = [
  { id: 'all', label: 'Toutes' },
  { id: 'unread', label: 'Non lues' },
  { id: 'pinned', label: 'Épinglées', icon: FiStar },
]

const MENU_ESTIMATED_HEIGHT = 280
const VIEWPORT_GAP = 8

function useFloatingStyle(open, anchorRef) {
  const [style, setStyle] = useState(null)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setStyle(null)
      return undefined
    }

    function update() {
      const rect = anchorRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_GAP
      const spaceAbove = rect.top - VIEWPORT_GAP
      const openUp = spaceBelow < MENU_ESTIMATED_HEIGHT && spaceAbove > spaceBelow

      const next = {
        position: 'fixed',
        minWidth: '12.5rem',
        maxWidth: `calc(100vw - ${VIEWPORT_GAP * 2}px)`,
        zIndex: 80,
      }

      if (openUp) next.bottom = window.innerHeight - rect.top + VIEWPORT_GAP
      else next.top = rect.bottom + VIEWPORT_GAP

      next.right = Math.max(VIEWPORT_GAP, window.innerWidth - rect.right)

      setStyle(next)
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchorRef])

  return style
}

export function ConversationFilterMenu({
  conversations,
  filter,
  onFilterChange,
  showArchived,
  onToggleArchived,
  userId,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const menuRef = useRef(null)
  const floatingStyle = useFloatingStyle(open, anchorRef)
  const hasActiveFilter = filter !== 'all' || showArchived

  useEffect(() => {
    if (!open) return undefined
    function handlePointer(event) {
      if (anchorRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function selectFilter(next) {
    onFilterChange(next)
    setOpen(false)
  }

  function toggleArchive() {
    onToggleArchived()
    setOpen(false)
  }

  const archivedCount = countConversationsForFilter(conversations, 'all', userId, true)

  const menu =
    open && floatingStyle
      ? createPortal(
          <div
            ref={menuRef}
            style={floatingStyle}
            className="panel-pop overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl"
            role="menu"
            aria-label="Filtrer les conversations"
          >
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-faint)]">
              Afficher
            </p>
            {FILTER_OPTIONS.map((item) => {
              const count = countConversationsForFilter(conversations, item.id, userId, false)
              const active = filter === item.id && !showArchived
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-[var(--app-surface-muted)] ${
                    active
                      ? 'bg-[var(--app-accent-soft)]/70 text-[var(--app-accent)]'
                      : 'text-[var(--app-text)]'
                  }`}
                  onClick={() => selectFilter(item.id)}
                >
                  {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                  <span className="min-w-0 flex-1">{item.label}</span>
                  {count ? (
                    <span className="message-filter-chip-count">{count}</span>
                  ) : null}
                  {active ? <FiCheck className="size-4 shrink-0" aria-hidden="true" /> : null}
                </button>
              )
            })}
            <div className="my-1 h-px bg-[var(--app-border)]" />
            <button
              type="button"
              role="menuitemradio"
              aria-checked={showArchived}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-[var(--app-surface-muted)] ${
                showArchived
                  ? 'bg-[var(--app-accent-soft)]/70 text-[var(--app-accent)]'
                  : 'text-[var(--app-text)]'
              }`}
              onClick={toggleArchive}
            >
              <FiArchive className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">{showArchived ? 'Actives' : 'Archives'}</span>
              {archivedCount ? (
                <span className="message-filter-chip-count">{archivedCount}</span>
              ) : null}
              {showArchived ? <FiCheck className="size-4 shrink-0" aria-hidden="true" /> : null}
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div ref={anchorRef} className={className}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`grid size-10 shrink-0 place-items-center rounded-xl shadow-sm transition ${
            hasActiveFilter
              ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] ring-1 ring-brand-200/80 dark:ring-brand-800/60'
              : 'bg-[var(--app-surface-muted)] text-[var(--app-accent)]'
          }`}
          aria-label="Filtrer les conversations"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <FiFilter />
        </button>
      </div>
      {menu}
    </>
  )
}
