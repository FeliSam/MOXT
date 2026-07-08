export function messageReadLabel(message, userId) {
  if (!isMessageFromUser(message, userId)) return ''
  const readers = (message.readBy || []).filter((id) => id !== userId)
  if (readers.length > 0) return '· Lu'
  if (message.deliveredTo?.length) return '· Distribué'
  return '· Envoyé'
}

export function conversationPreview(conversation, userId) {
  const last = conversation.messages.at(-1)
  if (last?.text) {
    const prefix = isMessageFromUser(last, userId) ? 'Vous : ' : ''
    const attachmentHint = last.attachment ? '📎 ' : ''
    return `${prefix}${attachmentHint}${last.text}`
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
