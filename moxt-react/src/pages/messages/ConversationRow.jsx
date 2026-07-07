import { FiBellOff, FiCpu, FiStar } from 'react-icons/fi'
import { getConversationPeer } from '../../features/communications/conversationDisplay'
import { conversationPreview } from './messageUtils'
import { shortTime } from './format'
import { MessageAvatar } from './MessageBubble'

export function ConversationRow({ active, assistant = false, conversation, onClick, userId }) {
  const peer = assistant ? null : getConversationPeer(conversation, userId)
  const lastMessage = assistant
    ? 'Comment puis-je vous aider aujourd’hui ?'
    : conversationPreview(conversation, userId)
  const unread = assistant ? 0 : conversation.unreadBy?.[userId] || 0
  const pinned = !assistant && conversation.pinnedBy?.includes(userId)
  const muted = !assistant && conversation.mutedBy?.includes(userId)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group mb-2 flex min-h-[5.6rem] min-w-0 w-full items-center gap-3 rounded-[1.35rem] p-3.5 text-left transition-all duration-[var(--transition-fast)] sm:p-4 ${
        active
          ? 'bg-[var(--app-accent-soft)] shadow-[0_14px_34px_rgb(15_23_42/0.12)] ring-1 ring-brand-200/70 dark:ring-brand-900/70'
          : 'bg-[var(--app-surface)] shadow-[0_8px_24px_rgb(15_23_42/0.05)] hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgb(15_23_42/0.1)]'
      }`}
    >
      {assistant ? (
        <span className="grid size-14 shrink-0 place-items-center rounded-[1.15rem] bg-gradient-to-br from-brand-500 to-cyan-500 text-lg font-black text-white shadow-md">
          <FiCpu />
        </span>
      ) : (
        <MessageAvatar
          avatarUrl={peer?.avatarUrl}
          className="!size-14 !rounded-[1.15rem] !text-lg shadow-md"
          name={peer?.name}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <strong className="flex min-w-0 items-center gap-1.5 truncate text-[15px] leading-5">
            {pinned ? <FiStar className="shrink-0 text-amber-500" /> : null}
            <span className="truncate">{assistant ? 'Assistant MOXT' : peer?.name}</span>
            {muted ? <FiBellOff className="shrink-0 text-[var(--app-text-faint)]" /> : null}
          </strong>
          <time className="shrink-0 text-[10px] font-bold text-[var(--app-text-faint)] sm:rounded-full sm:bg-[var(--app-surface-muted)] sm:px-2 sm:py-0.5">
            {assistant ? 'Toujours là' : shortTime(conversation.updatedAt)}
          </time>
        </span>
        <span className="mt-1 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-[var(--app-text-faint)]">
            {lastMessage}
          </span>
          {unread ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-black text-white dark:bg-brand-500">
              {unread}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  )
}
