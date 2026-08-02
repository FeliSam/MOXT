/**
 * Resolve which text/sender represents the latest conversation preview.
 * Prefer denormalized lastMessage* fields when newer than the loaded message window.
 *
 * @param {object} conversation
 * @param {string} [userId]
 * @returns {{ text: string, senderId: string, createdAt: string | null, source: 'meta' | 'message' } | null}
 */
export function resolveConversationPreviewMessage(conversation, userId) {
  if (!conversation) return null

  const uid = userId != null ? String(userId) : ''
  const allMessages = Array.isArray(conversation.messages) ? conversation.messages : []
  const visibleMessages = allMessages.filter((message) => {
    if (!uid) return true
    const deletedBy = message?.deletedBy ?? message?.deleted_by
    if (!Array.isArray(deletedBy)) return true
    return !deletedBy.map(String).includes(uid)
  })

  const lastLoaded = latestMessage(visibleMessages)
  const metaText = String(
    conversation.lastMessageText ?? conversation.last_message_text ?? '',
  ).trim()
  const metaSenderId = String(
    conversation.lastMessageSenderId ?? conversation.last_message_sender_id ?? '',
  )
  const metaAt = conversation.lastMessageAt ?? conversation.last_message_at ?? null
  const loadedAt = lastLoaded?.createdAt ?? lastLoaded?.created_at ?? null
  const metaTime = metaAt ? new Date(metaAt).getTime() : 0
  const loadedTime = loadedAt ? new Date(loadedAt).getTime() : 0
  const loadedText = String(lastLoaded?.text ?? '').trim()
  const loadedPreviewable = Boolean(loadedText || lastLoaded?.attachment)

  const metaMatchesDeletedLocal = allMessages.some((message) => {
    const deletedBy = message?.deletedBy ?? message?.deleted_by
    if (!uid || !Array.isArray(deletedBy) || !deletedBy.map(String).includes(uid)) {
      return false
    }
    const messageAt = message.createdAt || message.created_at
    if (metaAt && messageAt) {
      const delta = Math.abs(new Date(messageAt).getTime() - new Date(metaAt).getTime())
      if (delta < 1000) return true
    }
    return Boolean(metaText && String(message.text || '').trim() === metaText)
  })

  const preferMeta =
    Boolean(metaText) &&
    !metaMatchesDeletedLocal &&
    (!loadedPreviewable ||
      (metaTime > 0 && loadedTime > 0 && metaTime > loadedTime) ||
      (metaTime > 0 && !loadedTime))

  if (!preferMeta && loadedPreviewable && lastLoaded) {
    return {
      text: loadedText,
      senderId: String(lastLoaded.senderId ?? lastLoaded.sender_id ?? ''),
      createdAt: loadedAt,
      source: 'message',
      message: lastLoaded,
    }
  }

  if (metaText) {
    return {
      text: metaText,
      senderId: metaSenderId,
      createdAt: metaAt,
      source: 'meta',
      message: null,
    }
  }

  return null
}

function latestMessage(messages) {
  if (!messages?.length) return null
  return messages.reduce((latest, message) => {
    const latestTime = new Date(latest?.createdAt || latest?.created_at || 0).getTime()
    const messageTime = new Date(message?.createdAt || message?.created_at || 0).getTime()
    return messageTime >= latestTime ? message : latest
  })
}
