import { attachmentPreviewLabel, attachmentSearchText } from '../../features/communications/attachmentUtils'
import { getConversationPeer } from '../../features/communications/conversationDisplay'

export function messageSearchHaystack(message) {
  if (!message) return ''
  const parts = [message.text || '']
  if (message.attachment) {
    parts.push(attachmentSearchText(message.attachment))
  }
  return parts.join(' ').toLowerCase()
}

/** Client-side conversation filter: peer name, last preview, message text, attachment labels. */
export function conversationMatchesQuery(conversation, userId, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const peer = getConversationPeer(conversation, userId)
  if (peer?.name?.toLowerCase().includes(normalized)) return true

  const lastPreview =
    conversation.lastMessageText ?? conversation.last_message_text ?? ''
  if (String(lastPreview).toLowerCase().includes(normalized)) return true

  return (conversation.messages || []).some((message) =>
    messageSearchHaystack(message).includes(normalized),
  )
}

export function messageReadLabel(message, userId) {
  if (!isMessageFromUser(message, userId)) return ''
  const selfId = String(userId)
  const readers = (message.readBy || []).map(String).filter((id) => id && id !== selfId)
  if (readers.length > 0) return '· Lu'
  const delivered = (message.deliveredTo || []).map(String).filter((id) => id && id !== selfId)
  if (delivered.length > 0) return '· Distribué'
  return '· Envoyé'
}

export function messageHasReactions(message) {
  return Boolean(
    message?.reactions &&
      Object.entries(message.reactions).some(([, users]) => users?.length),
  )
}

export function conversationPreview(conversation, userId) {
  const last = conversation.messages.at(-1)
  if (last?.attachment) {
    const prefix = isMessageFromUser(last, userId) ? 'Vous : ' : ''
    const label = attachmentPreviewLabel(last.attachment)
    if (!last.text?.trim()) return `${prefix}${label}`
    const attachmentHint = `${label} · `
    return `${prefix}${attachmentHint}${last.text}`
  }
  if (last?.text) {
    const prefix = isMessageFromUser(last, userId) ? 'Vous : ' : ''
    return `${prefix}${last.text}`
  }

  const previewText = conversation.lastMessageText ?? conversation.last_message_text
  if (previewText) {
    const senderId = conversation.lastMessageSenderId ?? conversation.last_message_sender_id
    const prefix = isMessageFromUser({ senderId }, userId) ? 'Vous : ' : ''
    return `${prefix}${previewText}`
  }

  const total = conversationMessageCount(conversation, userId)
  return total > 0 ? `${total} message${total > 1 ? 's' : ''}` : 'Démarrez la conversation'
}

export function conversationMessageCount(conversation, userId) {
  const visible = (conversation.messages || []).filter(
    (message) => !message.deletedBy?.includes(userId),
  )
  return Math.max(visible.length, conversation.messageCount || 0)
}

export function countUnreadMessages(conversations, userId) {
  return conversations.reduce((total, item) => total + (item.unreadBy?.[userId] || 0), 0)
}

export function countConversationsForFilter(conversations, filter, userId, showArchived) {
  return conversations.filter((item) => {
    const archived = item.archivedBy?.includes(userId)
    if (showArchived !== Boolean(archived)) return false
    if (filter === 'unread' && !(item.unreadBy?.[userId] > 0)) return false
    if (filter === 'pinned' && !item.pinnedBy?.includes(userId)) return false
    return true
  }).length
}

export function resolveNotificationTarget(notification, conversations = []) {
  if (notification.type === 'message') {
    if (notification.link) {
      try {
        const url = new URL(notification.link, 'http://moxt.local')
        const conversationId = url.searchParams.get('conversation')
        if (conversationId) {
          return `/messages?conversation=${encodeURIComponent(conversationId)}`
        }

        const relatedType = url.searchParams.get('relatedType')
        const relatedId = url.searchParams.get('relatedId')
        if (relatedType && relatedId) {
          const match = conversations.find(
            (item) => item.relatedType === relatedType && item.relatedId === relatedId,
          )
          if (match) {
            return `/messages?conversation=${encodeURIComponent(match.id)}`
          }
          return `/messages?relatedType=${encodeURIComponent(relatedType)}&relatedId=${encodeURIComponent(relatedId)}`
        }
      } catch {
        // ignore malformed links
      }
    }
    return '/messages'
  }

  return notification.link || null
}

export function isMessageNotification(notification) {
  return notification.type === 'message' || notification.link?.startsWith('/messages')
}

export function isMessageFromUser(message, userId) {
  if (!message || !userId) return false
  return String(message.senderId ?? message.sender_id) === String(userId)
}
