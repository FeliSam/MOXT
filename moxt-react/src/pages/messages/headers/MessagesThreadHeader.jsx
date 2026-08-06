import {
  FiArchive,
  FiBell,
  FiBellOff,
  FiEye,
  FiEyeOff,
  FiSlash,
  FiStar,
  FiUser,
} from 'react-icons/fi'
import { LuArrowLeft, LuEllipsisVertical, LuExternalLink, LuSearch, LuX } from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { EntityAvatar } from '../../../features/account/EntityAvatar'
import { messagesText } from '../../../features/communications/messagesI18n'
import { PopoverMenu } from '../../../components/ui/PopoverMenu'
import { VerifiedDisplayName } from '../../../components/ui/Badge'
import { HEADER_ICON_STROKE, MESSAGES_THREAD_BACK_BTN_CLASS } from '../../../components/layout/headerLayout'
import { HeaderActionsBar, HeaderBrandChip, HeaderRow } from '../../../components/layout/HeaderChrome'
import { peerActivityLabel } from '../format'
import { TypingDots } from '../TypingIndicator'

export function MessagesThreadHeader({
  t,
  active,
  relatedPreview,
  peer,
  peerAvatarSrc,
  peerOnline,
  peerTyping,
  pinned,
  muted,
  blocked,
  archived,
  suggestionsEnabled,
  showRelatedContext,
  showBackButton = true,
  threadSearchOpen,
  onToggleThreadSearch,
  onBack,
  onPin,
  onMute,
  onToggleSuggestions,
  onArchive,
  onBlock,
}) {
  return (
    <HeaderRow>
      <HeaderBrandChip compact>
        {showBackButton ? (
          <button
            type="button"
            className={MESSAGES_THREAD_BACK_BTN_CLASS}
            onClick={onBack}
            aria-label={t('messages.closeConversation')}
          >
            <LuX className="header-action-icon lg:hidden" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
            <LuArrowLeft
              className="header-action-icon hidden lg:block"
              strokeWidth={HEADER_ICON_STROKE}
              aria-hidden="true"
            />
          </button>
        ) : null}
        <Link to={peer?.id ? `/users/${peer.id}/publications` : '#'} className="relative shrink-0">
          <EntityAvatar
            name={peer.name}
            src={peerAvatarSrc}
            size="md"
            shape="user"
            ring={false}
            className="!size-[2.185rem] !rounded-full shadow-sm sm:!size-[2.458125rem]"
            alt={peer.name}
          />
          {peerOnline ? (
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--app-surface)] bg-emerald-500"
              aria-hidden="true"
            />
          ) : null}
        </Link>
        <div className="min-w-0">
          <Link
            to={peer?.id ? `/users/${peer.id}/publications` : '#'}
            className="flex min-w-0 items-center gap-1.5 hover:underline"
          >
            <VerifiedDisplayName
              as="h2"
              name={peer.name}
              verified={Boolean(peer.verified)}
              iconSize="sm"
              className="truncate text-sm font-black leading-none tracking-tight text-[var(--app-text)] sm:text-[0.9375rem]"
            />
            {pinned ? (
              <FiStar className="size-3.5 shrink-0 text-amber-500" aria-label={t('messages.pinnedAria')} />
            ) : null}
            {muted ? (
              <FiBellOff className="size-3.5 shrink-0 text-[var(--app-text-faint)]" aria-label={t('messages.mutedAria')} />
            ) : null}
          </Link>
          <div className="mt-0.5 flex min-w-0 items-center">
            {peerTyping ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold leading-tight text-brand-700 dark:text-brand-300">
                {t('messages.typing')}
                <TypingDots />
              </span>
            ) : peerOnline ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold leading-tight text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                {t('messages.activity.online')}
              </span>
            ) : (
              <span className="truncate text-[11px] leading-tight text-[var(--app-text-muted)]">
                {peerActivityLabel(peer.lastActiveAt, t)}
              </span>
            )}
          </div>
        </div>
      </HeaderBrandChip>
      <HeaderActionsBar>
        <button
          type="button"
          className="header-action-btn relative grid"
          onClick={onToggleThreadSearch}
          aria-label={threadSearchOpen ? t('messages.closeSearchInThread') : t('messages.searchInThread')}
          aria-pressed={threadSearchOpen}
        >
          <LuSearch className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
        </button>
        {showRelatedContext ? (
          <Link
            className="header-action-btn relative grid lg:hidden"
            to={active.relatedPath || relatedPreview.path}
            aria-label={t('messages.viewListing')}
          >
            <LuExternalLink className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
          </Link>
        ) : null}
        {showRelatedContext ? (
          <Link
            className="hidden h-[3.004375rem] shrink-0 items-center gap-1.5 rounded-full bg-[var(--app-surface)]/65 px-3 text-xs font-bold text-brand-700 backdrop-blur-md transition hover:bg-[var(--app-surface)]/80 sm:h-[3.3048125rem] lg:inline-flex dark:text-brand-300"
            to={active.relatedPath || relatedPreview.path}
          >
            Voir la fiche <LuExternalLink className="size-3.5" strokeWidth={HEADER_ICON_STROKE} />
          </Link>
        ) : null}
        <PopoverMenu
          ariaLabel={messagesText(t, 'messages.conversationOptionsAria')}
          trigger={
            <span className="header-action-btn relative grid cursor-pointer">
              <LuEllipsisVertical className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
            </span>
          }
        >
          {peer?.id ? (
            <Link
              to={`/users/${peer.id}/publications`}
              role="menuitem"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
            >
              <FiUser /> {t('messages.viewProfile')}
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
            onClick={onPin}
          >
            <FiStar /> {pinned ? t('messages.unpin') : t('messages.pin')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
            onClick={onMute}
          >
            {muted ? <FiBell /> : <FiBellOff />} {muted ? t('messages.unmute') : t('messages.mute')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
            onClick={onToggleSuggestions}
          >
            {suggestionsEnabled ? <FiEye /> : <FiEyeOff />}{' '}
            {suggestionsEnabled
              ? messagesText(t, 'messages.hideSuggestions')
              : messagesText(t, 'messages.showSuggestions')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
            onClick={onArchive}
          >
            <FiArchive /> {archived ? messagesText(t, 'messages.restore') : messagesText(t, 'messages.archive')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={onBlock}
          >
            <FiSlash /> {blocked ? t('messages.unblock') : t('messages.block')}
          </button>
        </PopoverMenu>
      </HeaderActionsBar>
    </HeaderRow>
  )
}
