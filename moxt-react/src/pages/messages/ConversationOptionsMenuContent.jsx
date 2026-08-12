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
import { Link } from 'react-router-dom'
import { messagesText } from '../../features/communications/messagesI18n'

const MENU_ITEM_CLASS =
  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]'
const MENU_ITEM_DANGER_CLASS =
  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30'

export function ConversationOptionsMenuContent({
  t,
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
  function runAction(event, handler) {
    event.preventDefault()
    event.stopPropagation()
    handler?.()
    onClose?.()
  }

  return (
    <>
      {peer?.id ? (
        <Link
          to={`/users/${peer.id}/publications`}
          role="menuitem"
          className={MENU_ITEM_CLASS}
          onClick={() => onClose?.()}
        >
          <FiUser /> {t('messages.viewProfile')}
        </Link>
      ) : null}
      <button
        type="button"
        role="menuitem"
        className={MENU_ITEM_CLASS}
        onClick={(event) => runAction(event, onPin)}
      >
        <FiStar /> {pinned ? t('messages.unpin') : t('messages.pin')}
      </button>
      <button
        type="button"
        role="menuitem"
        className={MENU_ITEM_CLASS}
        onClick={(event) => runAction(event, onMute)}
      >
        {muted ? <FiBell /> : <FiBellOff />} {muted ? t('messages.unmute') : t('messages.mute')}
      </button>
      <button
        type="button"
        role="menuitem"
        className={MENU_ITEM_CLASS}
        onClick={(event) => runAction(event, onToggleSuggestions)}
      >
        {suggestionsEnabled ? <FiEye /> : <FiEyeOff />}{' '}
        {suggestionsEnabled
          ? messagesText(t, 'messages.hideSuggestions')
          : messagesText(t, 'messages.showSuggestions')}
      </button>
      <button
        type="button"
        role="menuitem"
        className={MENU_ITEM_CLASS}
        onClick={(event) => runAction(event, onArchive)}
      >
        <FiArchive /> {archived ? messagesText(t, 'messages.restore') : messagesText(t, 'messages.archive')}
      </button>
      <button
        type="button"
        role="menuitem"
        className={MENU_ITEM_DANGER_CLASS}
        onClick={(event) => runAction(event, onBlock)}
      >
        <FiSlash /> {blocked ? t('messages.unblock') : t('messages.block')}
      </button>
    </>
  )
}
