import { FiBellOff, FiCpu, FiStar } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { RELATED_CONTENT_META } from '../../config/communications'
import { VerifiedDisplayName } from '../../components/ui/Badge'
import { useLanguage } from '../../contexts/useLanguage'
import { EntityAvatar } from '../../features/account/EntityAvatar'
import { getConversationPeer } from '../../features/communications/conversationDisplay'
import { messagesText } from '../../features/communications/messagesI18n'
import { conversationPreview } from './messageUtils'
import { shortTime } from './format'

const LIST_AVATAR_CLASS =
  '!size-11 !rounded-full !text-xs font-black self-center sm:!size-12'

export function ConversationRow({
  active,
  assistant = false,
  avatarMap = {},
  conversation,
  divided = true,
  onClick,
  showOnlineDot = false,
  userId,
}) {
  const { t } = useLanguage()
  const peer = assistant ? null : getConversationPeer(conversation, userId)
  const liveEntry = peer?.id ? avatarMap[peer.id] : undefined
  const avatarSrc =
    liveEntry !== undefined ? liveEntry.avatarUrl || null : peer?.avatarUrl || null
  const peerOnline = useSelector((state) =>
    showOnlineDot && peer?.id ? Boolean(state.presence?.online?.[peer.id]) : false,
  )
  const lastMessage = assistant
    ? messagesText(t, 'messages.assistant.preview')
    : conversationPreview(conversation, userId, t)
  const unread = assistant ? 0 : conversation.unreadBy?.[userId] || 0
  const pinned = !assistant && conversation.pinnedBy?.includes(userId)
  const muted = !assistant && conversation.mutedBy?.includes(userId)
  const relatedMeta =
    !assistant && conversation.relatedType
      ? RELATED_CONTENT_META[conversation.relatedType] || RELATED_CONTENT_META.general
      : null
  const RelatedIcon = relatedMeta?.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[3.875rem] min-w-0 w-full items-stretch gap-2.5 rounded-2xl pl-2.5 text-left transition-colors duration-[var(--transition-fast)] sm:min-h-[4.125rem] sm:gap-3 sm:pl-3 ${
        active
          ? 'bg-[var(--app-accent-soft)]'
          : 'bg-transparent hover:bg-[var(--app-surface)]/55'
      }`}
    >
      {assistant ? (
        <span className="grid size-11 shrink-0 place-items-center self-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-base font-black text-white sm:size-12">
          <FiCpu />
        </span>
      ) : (
        <span className="relative shrink-0 self-center">
          <EntityAvatar
            name={peer?.name}
            src={avatarSrc}
            size="lg"
            shape="user"
            ring={false}
            className={LIST_AVATAR_CLASS}
            alt={peer?.name || ''}
          />
          {peerOnline ? (
            <span
              className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--app-surface-muted)]"
              title={messagesText(t, 'messages.activity.online')}
              aria-label={messagesText(t, 'messages.activity.online')}
            />
          ) : RelatedIcon ? (
            <span
              className={`absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full text-[9px] text-white ${relatedMeta.tone}`}
              aria-hidden="true"
            >
              <RelatedIcon />
            </span>
          ) : null}
          {peerOnline && RelatedIcon ? (
            <span
              className={`absolute -bottom-0.5 -left-0.5 grid size-4 place-items-center rounded-full text-[9px] text-white ${relatedMeta.tone}`}
              aria-hidden="true"
            >
              <RelatedIcon />
            </span>
          ) : null}
        </span>
      )}
      <span
        className={`flex min-w-0 flex-1 flex-col justify-center py-2 pr-2.5 sm:py-2.5 sm:pr-3 ${
          divided ? 'border-b border-[var(--app-border)]/45' : ''
        }`}
      >
        <span className="flex items-baseline justify-between gap-2">
          <strong
            className={`flex min-w-0 items-center gap-1.5 truncate text-[13px] leading-4 ${
              unread ? 'font-black text-[var(--app-text)]' : 'font-semibold text-[var(--app-text)]'
            }`}
          >
            {pinned ? <FiStar className="size-3 shrink-0 text-amber-500" /> : null}
            <VerifiedDisplayName
              name={assistant ? messagesText(t, 'messages.assistant.name') : peer?.name}
              verified={!assistant && Boolean(peer?.verified)}
              iconSize="sm"
              className="min-w-0 flex-1"
              nameClassName="truncate"
            />
            {muted ? <FiBellOff className="size-3 shrink-0 text-[var(--app-text-faint)]" /> : null}
          </strong>
          <time
            className={`shrink-0 text-[10px] tabular-nums leading-none ${
              unread
                ? 'font-semibold text-[var(--app-accent)]'
                : 'font-medium text-[var(--app-text-faint)]'
            }`}
          >
            {assistant
              ? messagesText(t, 'messages.assistant.alwaysThere')
              : shortTime(
                  conversation.lastMessageAt ||
                    conversation.last_message_at ||
                    conversation.updatedAt,
                )}
          </time>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span
            className={`min-w-0 flex-1 truncate text-[12px] leading-4 ${
              unread
                ? 'font-medium text-[var(--app-text-muted)]'
                : 'font-normal text-[var(--app-text-faint)]'
            }`}
          >
            {lastMessage}
          </span>
          {unread ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white dark:bg-brand-500">
              {unread}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  )
}
