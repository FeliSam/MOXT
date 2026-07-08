import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiAlertTriangle,
  FiExternalLink,
  FiMessageSquare,
  FiMoreHorizontal,
  FiSlash,
  FiUserMinus,
  FiUserX,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { PillBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SUBSCRIPTION_NOTIFY_LABELS } from '@moxt/shared/utils/subscriptionUtils.js'
import { usePublicationProfile } from '../publications/usePublicationProfile'
import { findConversationByParticipants } from '../communications/conversationUtils'
import { toggleConversationBlock } from '../communications/communicationSlice'
import {
  banPublisherSubscriber,
  removeSubscriberByPublisher,
  reportPublisherSubscriber,
} from './accountSlice'
import { addToast } from '../ui/uiSlice'

const MENU_WIDTH = 240
const MENU_ESTIMATED_HEIGHT = 320
const VIEWPORT_GAP = 8

function formatDisplayName(profile, fallback = 'Membre MOXT') {
  const name = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
  return name || fallback
}

function useActionsMenuStyle(open, anchorRef) {
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
      const openUp =
        spaceBelow < MENU_ESTIMATED_HEIGHT && spaceAbove > spaceBelow

      const right = Math.max(VIEWPORT_GAP, window.innerWidth - rect.right)
      const next = {
        position: 'fixed',
        right,
        width: MENU_WIDTH,
        maxWidth: `calc(100vw - ${VIEWPORT_GAP * 2}px)`,
        zIndex: 80,
      }

      if (openUp) {
        next.bottom = window.innerHeight - rect.top + VIEWPORT_GAP
        next.maxHeight = Math.min(MENU_ESTIMATED_HEIGHT, spaceAbove)
      } else {
        next.top = rect.bottom + VIEWPORT_GAP
        next.maxHeight = Math.min(MENU_ESTIMATED_HEIGHT, Math.max(spaceBelow, 180))
      }

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

function MenuItem({ as: Component = 'button', icon: Icon, children, tone = 'default', ...props }) {
  const tones = {
    default: 'text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]',
    danger: 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30',
    warning: 'text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30',
  }

  return (
    <Component
      type={Component === 'button' ? 'button' : undefined}
      role="menuitem"
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold leading-5 transition ${tones[tone]}`}
      {...props}
    >
      <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
      <span className="min-w-0 flex-1">{children}</span>
    </Component>
  )
}

function MenuDivider() {
  return <div className="my-1 h-px bg-[var(--app-border)]" role="separator" />
}

export function SubscriberRow({
  subscriber,
  publisherType,
  publisherId,
  publisherName,
  publisherPath,
}) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector((state) => state.communications.conversations)
  const subscriberId = subscriber.userId || subscriber.subscriberId
  const { profile } = usePublicationProfile(subscriberId, user)
  const displayName = formatDisplayName(profile)

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [banOpen, setBanOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [reportReason, setReportReason] = useState('')

  const anchorRef = useRef(null)
  const menuRef = useRef(null)
  const floatingStyle = useActionsMenuStyle(menuOpen, anchorRef)

  const conversation = findConversationByParticipants(conversations, [user?.id, subscriberId])
  const isBlocked = conversation?.blockedBy?.includes(user?.id)

  useEffect(() => {
    if (!menuOpen) return undefined
    function handlePointer(event) {
      if (anchorRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setMenuOpen(false)
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  function basePayload() {
    return {
      publisherType,
      publisherId,
      subscriberId,
      publisherName,
      publisherPath,
    }
  }

  function handleRemove() {
    dispatch(removeSubscriberByPublisher(basePayload()))
    setConfirmRemove(false)
    setMenuOpen(false)
  }

  function handleBan(event) {
    event.preventDefault()
    if (banReason.trim().length < 5) return
    dispatch(
      banPublisherSubscriber({
        ...basePayload(),
        reason: banReason.trim(),
        bannedBy: user.id,
      }),
    )
    setBanOpen(false)
    setBanReason('')
    setMenuOpen(false)
  }

  function handleReport(event) {
    event.preventDefault()
    if (reportReason.trim().length < 10) return
    dispatch(
      reportPublisherSubscriber({
        ...basePayload(),
        reporterId: user.id,
        reason: reportReason.trim(),
      }),
    )
    setReportOpen(false)
    setReportReason('')
    setMenuOpen(false)
  }

  function handleBlockMessages() {
    if (!conversation) {
      dispatch(
        addToast({
          title: 'Aucune conversation',
          message: 'Aucun fil de messagerie existant avec ce membre.',
          tone: 'info',
        }),
      )
      setMenuOpen(false)
      return
    }
    dispatch(toggleConversationBlock({ id: conversation.id, userId: user.id }))
    dispatch(
      addToast({
        title: isBlocked ? 'Membre débloqué' : 'Membre bloqué',
        message: isBlocked
          ? 'Vous pouvez à nouveau recevoir ses messages.'
          : 'Ses messages sont bloqués dans cette conversation.',
        tone: 'success',
      }),
    )
    setMenuOpen(false)
  }

  const menu =
    menuOpen && floatingStyle
      ? createPortal(
          <div
            ref={menuRef}
            style={floatingStyle}
            className="panel-pop overflow-y-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl"
            role="menu"
            aria-label={`Actions pour ${displayName}`}
          >
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-faint)]">
              Actions
            </p>

            <MenuItem
              as={Link}
              to={`/users/${subscriberId}/publications`}
              icon={FiExternalLink}
              onClick={() => setMenuOpen(false)}
            >
              Voir le profil
            </MenuItem>
            <MenuItem
              as={Link}
              to={conversation ? `/messages?conversation=${conversation.id}` : '/messages'}
              icon={FiMessageSquare}
              onClick={() => setMenuOpen(false)}
            >
              Envoyer un message
            </MenuItem>

            <MenuDivider />

            <MenuItem icon={FiSlash} onClick={handleBlockMessages}>
              {isBlocked ? 'Débloquer les messages' : 'Bloquer les messages'}
            </MenuItem>
            <MenuItem
              icon={FiUserMinus}
              onClick={() => {
                setConfirmRemove(true)
                setMenuOpen(false)
              }}
            >
              Retirer l&apos;abonné
            </MenuItem>

            <MenuDivider />

            <MenuItem
              icon={FiUserX}
              tone="danger"
              onClick={() => {
                setBanOpen(true)
                setMenuOpen(false)
              }}
            >
              Bannir
            </MenuItem>
            <MenuItem
              icon={FiAlertTriangle}
              tone="warning"
              onClick={() => {
                setReportOpen(true)
                setMenuOpen(false)
              }}
            >
              Signaler
            </MenuItem>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-sm font-bold text-[var(--app-accent)]">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-[15px] leading-5">{displayName}</strong>
            <span className="mt-0.5 block text-xs leading-4 text-[var(--app-text-faint)]">
              Depuis {new Date(subscriber.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PillBadge tone={subscriber.notifyPref === 'muted' ? 'neutral' : 'success'}>
            {SUBSCRIPTION_NOTIFY_LABELS[subscriber.notifyPref] || subscriber.notifyPref}
          </PillBadge>
          <div ref={anchorRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={`Actions pour ${displayName}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="grid size-9 place-items-center rounded-xl border border-[var(--app-border)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
            >
              <FiMoreHorizontal />
            </button>
          </div>
        </div>
      </div>
      {menu}

      <ConfirmDialog
        open={confirmRemove}
        title="Retirer cet abonné ?"
        description={`${displayName} ne verra plus vos publications en priorité et ne recevra plus de notifications. Il pourra se réabonner plus tard.`}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={handleRemove}
      />

      <Modal open={banOpen} onClose={() => setBanOpen(false)} title="Bannir cet abonné">
        <p className="text-sm leading-6 text-[var(--app-text-muted)]">
          {displayName} sera retiré et ne pourra plus s&apos;abonner à vos publications.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={handleBan}>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold">Motif (obligatoire)</span>
            <textarea
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
              rows={3}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm leading-6"
              placeholder="Comportement abusif, spam, harcèlement…"
              required
              minLength={5}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setBanOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="danger">
              Bannir
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Signaler cet abonné">
        <p className="text-sm leading-6 text-[var(--app-text-muted)]">
          Ce signalement sera transmis à la modération MOXT. L&apos;abonnement reste actif sauf si
          vous le retirez ou le bannissez.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={handleReport}>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold">Description (obligatoire)</span>
            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              rows={4}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm leading-6"
              placeholder="Décrivez le comportement problématique…"
              required
              minLength={10}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setReportOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Envoyer le signalement</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
