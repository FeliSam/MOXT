import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../contexts/useLanguage'
import { messagesText } from '../../features/communications/messagesI18n'
import { vibrateMenuOpen } from '../../utils/deviceVibrate'
import { ConversationOptionsMenuContent } from './ConversationOptionsMenuContent'

function readBottomNavClearance(anchor) {
  const root = anchor?.closest('.messages-shell') || document.documentElement
  const raw = getComputedStyle(root).getPropertyValue('--bottom-nav-clearance').trim()
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : 0
}

function computeConversationMenuCoords(anchor, menuEl, triggerEl) {
  if (!anchor) return null

  const rect = (triggerEl || anchor).getBoundingClientRect()
  const menuHeight = Math.max(menuEl?.offsetHeight || 0, 270)
  const menuWidth = Math.max(menuEl?.offsetWidth || 0, 176)
  const gap = 8
  const pad = 8

  const scrollEl =
    anchor.closest('[data-testid="messages-list-scroll"]') ||
    anchor.closest('.scrollbar-hidden') ||
    anchor.closest('.messages-floating-panel')
  const scrollRect = scrollEl?.getBoundingClientRect()

  const navClearance = readBottomNavClearance(anchor)
  const viewportTop = pad
  const viewportBottom = window.innerHeight - navClearance - pad

  const boundTop = Math.max(scrollRect?.top ?? viewportTop, viewportTop) + pad
  const boundBottom = Math.min(
    (scrollRect?.bottom ?? viewportBottom) - pad,
    viewportBottom,
  )
  const boundLeft = (scrollRect?.left ?? pad) + pad
  const boundRight = (scrollRect?.right ?? window.innerWidth) - pad

  const roomBelow = boundBottom - rect.bottom - gap
  const roomAbove = rect.top - boundTop - gap

  let placement = 'below'
  if (roomBelow < menuHeight) {
    if (roomAbove >= menuHeight || roomAbove >= roomBelow) {
      placement = 'above'
    }
  }

  let top = placement === 'below' ? rect.bottom + gap : rect.top - menuHeight - gap
  top = Math.max(boundTop, Math.min(top, boundBottom - menuHeight))

  if (top + menuHeight > boundBottom + 1) {
    placement = 'above'
    top = rect.top - menuHeight - gap
    top = Math.max(boundTop, Math.min(top, boundBottom - menuHeight))
  }

  let left = rect.right - menuWidth
  left = Math.max(boundLeft, Math.min(left, boundRight - menuWidth))

  return { top, left, placement }
}

export function ConversationFloatingMenu({
  open,
  anchorRef,
  triggerRef,
  peer,
  pinned,
  muted,
  blocked,
  archived,
  suggestionsEnabled,
  onPin,
  onMute,
  onToggleSuggestions,
  onArchive,
  onBlock,
  onClose,
}) {
  const { t } = useLanguage()
  const menuRef = useRef(null)
  const [coords, setCoords] = useState(null)

  useLayoutEffect(() => {
    if (!open) return undefined

    vibrateMenuOpen()

    function updateCoords() {
      const next = computeConversationMenuCoords(
        anchorRef.current,
        menuRef.current,
        triggerRef?.current,
      )
      if (next) setCoords(next)
    }

    updateCoords()
    const raf = requestAnimationFrame(updateCoords)

    const menuEl = menuRef.current
    const resizeObserver =
      menuEl && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateCoords)
        : null
    resizeObserver?.observe(menuEl)

    const scrollEl =
      anchorRef.current?.closest('[data-testid="messages-list-scroll"]') ||
      anchorRef.current?.closest('.scrollbar-hidden') ||
      anchorRef.current?.closest('.messages-floating-panel')

    scrollEl?.addEventListener('scroll', updateCoords, { passive: true })
    window.addEventListener('resize', updateCoords, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      scrollEl?.removeEventListener('scroll', updateCoords)
      window.removeEventListener('resize', updateCoords)
    }
  }, [open, anchorRef, triggerRef])

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (menuRef.current?.contains(event.target)) return
      if (triggerRef?.current?.contains(event.target)) return
      if (anchorRef.current?.contains(event.target)) return
      onClose?.()
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, anchorRef, triggerRef])

  if (!open || typeof document === 'undefined') return null

  const placement = coords?.placement || 'below'
  const enterClass =
    coords && placement === 'above'
      ? 'conversation-options-menu--enter-above'
      : coords
        ? 'conversation-options-menu--enter-below'
        : ''

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={messagesText(t, 'messages.conversationOptionsAria')}
      className={`conversation-options-menu conversation-options-menu--portal panel-pop ${enterClass} ${
        placement === 'above' ? 'conversation-options-menu--above' : ''
      }`}
      style={{
        top: coords?.top ?? -9999,
        left: coords?.left ?? 0,
        visibility: coords ? 'visible' : 'hidden',
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <ConversationOptionsMenuContent
        t={t}
        peer={peer}
        pinned={pinned}
        muted={muted}
        blocked={blocked}
        archived={archived}
        suggestionsEnabled={suggestionsEnabled}
        onPin={onPin}
        onMute={onMute}
        onToggleSuggestions={onToggleSuggestions}
        onArchive={onArchive}
        onBlock={onBlock}
        onClose={onClose}
      />
    </div>,
    document.body,
  )
}
