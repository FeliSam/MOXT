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
import { PillBadge, VerifiedDisplayName } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { usePublicationProfile } from '../publications/usePublicationProfile'
import { findConversationByParticipants } from '../communications/conversationUtils'
import { toggleConversationBlock } from '../communications/communicationSlice'
import {
  banPublisherSubscriber,
  removeSubscriberByPublisher,
  reportPublisherSubscriber,
} from './accountSlice'
import { addToast } from '../ui/uiSlice'
import { EntityAvatar } from './EntityAvatar'

const MENU_WIDTH = 240
const MENU_ESTIMATED_HEIGHT = 320
const VIEWPORT_GAP = 8

const NOTIFY_LABEL_KEYS = {
  all: 'subscriptions.notify.all',
  important: 'subscriptions.notify.important',
  muted: 'subscriptions.notify.muted',
}

function formatDisplayName(profile, fallback) {
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
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector((state) => state.communications.conversations)
  const subscriberId = subscriber.userId || subscriber.subscriberId
  const { profile } = usePublicationProfile(subscriberId, user)
  const displayName = formatDisplayName(profile, p3('common.memberMoxt'))
  const prefLabelKey = NOTIFY_LABEL_KEYS[subscriber.notifyPref]
  const prefLabel = prefLabelKey ? p3(prefLabelKey) : subscriber.notifyPref

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
          title: p3('subscriptions.row.noConversationTitle'),
          message: p3('subscriptions.row.noConversationMessage'),
          tone: 'info',
        }),
      )
      setMenuOpen(false)
      return
    }
    dispatch(toggleConversationBlock({ id: conversation.id, userId: user.id }))
    dispatch(
      addToast({
        title: isBlocked
          ? p3('subscriptions.row.unblockedTitle')
          : p3('subscriptions.row.blockedTitle'),
        message: isBlocked
          ? p3('subscriptions.row.unblockedMessage')
          : p3('subscriptions.row.blockedMessage'),
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
            aria-label={p3('subscriptions.row.actionsAria', { name: displayName })}
          >
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-faint)]">
              {p3('common.actions')}
            </p>

            <MenuItem
              as={Link}
              to={`/users/${subscriberId}/publications`}
              icon={FiExternalLink}
              onClick={() => setMenuOpen(false)}
            >
              {p3('subscriptions.row.viewProfile')}
            </MenuItem>
            <MenuItem
              as={Link}
              to={conversation ? `/messages?conversation=${conversation.id}` : '/messages'}
              icon={FiMessageSquare}
              onClick={() => setMenuOpen(false)}
            >
              {p3('subscriptions.row.sendMessage')}
            </MenuItem>

            <MenuDivider />

            <MenuItem icon={FiSlash} onClick={handleBlockMessages}>
              {isBlocked
                ? p3('subscriptions.row.unblockMessages')
                : p3('subscriptions.row.blockMessages')}
            </MenuItem>
            <MenuItem
              icon={FiUserMinus}
              onClick={() => {
                setConfirmRemove(true)
                setMenuOpen(false)
              }}
            >
              {p3('subscriptions.row.removeSubscriber')}
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
              {p3('subscriptions.row.ban')}
            </MenuItem>
            <MenuItem
              icon={FiAlertTriangle}
              tone="warning"
              onClick={() => {
                setReportOpen(true)
                setMenuOpen(false)
              }}
            >
              {p3('subscriptions.row.report')}
            </MenuItem>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={`/users/${subscriberId}/publications`}
            className="shrink-0 transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            aria-label={p3('subscriptions.row.viewProfileAria', { name: displayName })}
          >
            <EntityAvatar name={displayName} src={profile?.avatarUrl} size="md" shape="user" />
          </Link>
          <div className="min-w-0">
            <VerifiedDisplayName
              as="strong"
              name={displayName}
              verified={Boolean(profile?.verified)}
              iconSize="sm"
              className="block truncate text-[15px] leading-5"
            />
            <span className="mt-0.5 block text-xs leading-4 text-[var(--app-text-faint)]">
              {p3('subscriptions.row.since', {
                date: new Date(subscriber.createdAt).toLocaleDateString('fr-FR'),
              })}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PillBadge tone={subscriber.notifyPref === 'muted' ? 'neutral' : 'success'}>
            {prefLabel}
          </PillBadge>
          <div ref={anchorRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={p3('subscriptions.row.actionsAria', { name: displayName })}
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
        title={p3('subscriptions.row.removeConfirmTitle')}
        description={p3('subscriptions.row.removeConfirmDesc', { name: displayName })}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={handleRemove}
      />

      <Modal open={banOpen} onClose={() => setBanOpen(false)} title={p3('subscriptions.row.banTitle')}>
        <p className="text-sm leading-6 text-[var(--app-text-muted)]">
          {p3('subscriptions.row.banDesc', { name: displayName })}
        </p>
        <form className="mt-4 grid gap-3" onSubmit={handleBan}>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold">{p3('subscriptions.row.banReason')}</span>
            <textarea
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
              rows={3}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm leading-6"
              placeholder={p3('subscriptions.row.banPlaceholder')}
              required
              minLength={5}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setBanOpen(false)}>
              {p3('common.cancel')}
            </Button>
            <Button type="submit" variant="danger">
              {p3('subscriptions.row.ban')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={p3('subscriptions.row.reportTitle')}
      >
        <p className="text-sm leading-6 text-[var(--app-text-muted)]">
          {p3('subscriptions.row.reportDesc')}
        </p>
        <form className="mt-4 grid gap-3" onSubmit={handleReport}>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold">{p3('subscriptions.row.reportReason')}</span>
            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              rows={4}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm leading-6"
              placeholder={p3('subscriptions.row.reportPlaceholder')}
              required
              minLength={10}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setReportOpen(false)}>
              {p3('common.cancel')}
            </Button>
            <Button type="submit">{p3('support.sendBug')}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
