import { FiBriefcase, FiMessageSquare, FiUser } from 'react-icons/fi'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useActionBurst } from '../../../components/ui/ActionBurst'
import { Button } from '../../../components/ui/Button'
import { useLanguage } from '../../../contexts/useLanguage'
import { sharedText } from '../../../i18n/sharedI18n'
import { openConversationWithContact } from '../../communications/communicationSlice'
import { buildRelatedSnapshot } from '../../communications/relatedSnapshot'

const MENU_ESTIMATED_HEIGHT = 176
const VIEWPORT_GAP = 8

function useFloatingMenuStyle(open, anchorRef) {
  const [style, setStyle] = useState(null)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setStyle(null)
      return undefined
    }

    function update() {
      const rect = anchorRef.current.getBoundingClientRect()
      const menuWidth = Math.min(288, window.innerWidth - VIEWPORT_GAP * 2)
      const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_GAP
      const spaceAbove = rect.top - VIEWPORT_GAP
      const openUp = spaceBelow < MENU_ESTIMATED_HEIGHT && spaceAbove > spaceBelow

      const next = {
        position: 'fixed',
        width: menuWidth,
        maxWidth: `calc(100vw - ${VIEWPORT_GAP * 2}px)`,
        maxHeight: openUp
          ? Math.min(MENU_ESTIMATED_HEIGHT, spaceAbove)
          : Math.min(MENU_ESTIMATED_HEIGHT, Math.max(spaceBelow, 140)),
        zIndex: 120,
      }

      if (openUp) next.bottom = window.innerHeight - rect.top + VIEWPORT_GAP
      else next.top = rect.bottom + VIEWPORT_GAP

      next.left = Math.max(
        VIEWPORT_GAP,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - VIEWPORT_GAP),
      )

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

export function TransferContactMenu({
  transfer,
  className = '',
  variant = 'secondary',
  children,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const [open, setOpen] = useState(false)
  const [loadingTarget, setLoadingTarget] = useState(null)
  const anchorRef = useRef(null)
  const menuRef = useRef(null)
  const floatingStyle = useFloatingMenuStyle(open, anchorRef)
  const { trigger: triggerBurst, node: burstNode } = useActionBurst()

  const clientName = [transfer.sender?.firstName, transfer.sender?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  const businessName = transfer.exchanger?.name || t('transfers.detail.contact.businessFallback')

  const targets = [
    transfer.userId && transfer.userId !== user.id
      ? {
          key: 'client',
          ownerId: transfer.userId,
          label: t('transfers.detail.contact.clientOption', { name: clientName || t('transfers.detail.contact.clientFallback') }),
          hint: t('transfers.detail.contact.clientHint'),
          icon: FiUser,
          contactProfile: {
            firstName: transfer.sender?.firstName || '',
            lastName: transfer.sender?.lastName || '',
          },
        }
      : null,
    transfer.businessOwnerId &&
    transfer.businessOwnerId !== user.id &&
    transfer.businessOwnerId !== transfer.userId
      ? {
          key: 'business',
          ownerId: transfer.businessOwnerId,
          label: t('transfers.detail.contact.businessOption', { name: businessName }),
          hint: t('transfers.detail.contact.businessHint'),
          icon: FiBriefcase,
          contactProfile: {
            firstName: businessName.split(/\s+/)[0] || businessName,
            lastName: businessName.split(/\s+/).slice(1).join(' '),
          },
        }
      : null,
  ].filter(Boolean)

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (anchorRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
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

  if (!targets.length) return null

  async function openChat(event, target) {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    if (loadingTarget) return
    setLoadingTarget(target.key)
    triggerBurst(event)
    setOpen(false)
    const relatedSnapshot = buildRelatedSnapshot('transfer', transfer, {
      id: transfer.id,
      title: t('transfers.detail.relatedTitle', {
        id: transfer.id,
        contact: target.key === 'client' ? clientName : businessName,
      }),
      path: `/transfers/${transfer.id}`,
    })
    try {
      const result = await dispatch(
        openConversationWithContact({
          ownerId: target.ownerId,
          createdBy: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          relatedType: 'transfer',
          relatedId: transfer.id,
          relatedPath: `/transfers/${transfer.id}`,
          relatedSnapshot,
          contactProfile: target.contactProfile,
        }),
      ).unwrap()
      const params = new URLSearchParams({ conversation: result.conversation.id })
      if (result.contextAlreadyLinked && result.replyToContextId) {
        params.set('replyContext', result.replyToContextId)
      }
      navigate(`/messages?${params}`)
    } catch {
      navigate('/messages')
    } finally {
      setLoadingTarget(null)
    }
  }

  if (targets.length === 1) {
    const target = targets[0]
    return (
      <>
        {burstNode}
        <Button
          className={className}
          disabled={Boolean(loadingTarget)}
          icon={FiMessageSquare}
          variant={variant}
          onClick={(event) => openChat(event, target)}
        >
          {loadingTarget
            ? sharedText(t, 'shared.opening')
            : children || t('transfers.workflow.contactChat')}
        </Button>
      </>
    )
  }

  const menu =
    open && floatingStyle && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={floatingStyle}
            className="panel-pop overflow-y-auto overscroll-contain rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl"
          >
            {targets.map((target) => {
              const Icon = target.icon
              return (
                <button
                  key={target.key}
                  type="button"
                  role="menuitem"
                  disabled={Boolean(loadingTarget)}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--app-surface-muted)] disabled:opacity-60"
                  onClick={(event) => openChat(event, target)}
                >
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--app-text)]">{target.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-[var(--app-text-muted)]">
                      {target.hint}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {burstNode}
      <span ref={anchorRef} className={`inline-flex ${className}`}>
        <Button
          disabled={Boolean(loadingTarget)}
          icon={FiMessageSquare}
          variant={variant}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={(event) => {
            event.stopPropagation()
            setOpen((value) => !value)
          }}
        >
          {loadingTarget ? sharedText(t, 'shared.opening') : children || t('transfers.detail.contact.menu')}
        </Button>
      </span>
      {menu}
    </>
  )
}
