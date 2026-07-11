import { addToast } from '../features/ui/uiSlice'
import { getConversationPeer } from '../features/communications/conversationDisplay'
import {
  isMessageFromUser,
  resolveNotificationTarget,
} from '../pages/messages/messageUtils'
import { attachmentPreviewLabel } from '../features/communications/attachmentUtils'

let alertsEnabled = false
let enableTimer = null

const ENABLE_DELAY_MS = 2500

export function enableEngagementAlerts() {
  if (enableTimer) clearTimeout(enableTimer)
  alertsEnabled = false
  enableTimer = setTimeout(() => {
    alertsEnabled = true
    enableTimer = null
  }, ENABLE_DELAY_MS)
}

export function disableEngagementAlerts() {
  alertsEnabled = false
  if (enableTimer) {
    clearTimeout(enableTimer)
    enableTimer = null
  }
}

function isViewingConversation(conversationId) {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return (
    window.location.pathname === '/messages' &&
    params.get('conversation') === conversationId
  )
}

function previewMessage(message) {
  const text = message.text?.trim()
  if (text) {
    return text.length > 72 ? `${text.slice(0, 72)}…` : text
  }
  if (message.attachment) {
    return attachmentPreviewLabel(message.attachment)
  }
  return 'Nouveau message'
}

export const engagementToastMiddleware = (store) => (next) => (action) => {
  const result = next(action)

  if (!alertsEnabled) return result
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return result

  const state = store.getState()
  const userId = state.auth.user?.id
  if (!userId) return result

  if (action.type === 'communications/receiveRemoteMessage') {
    const { conversationId, message } = action.payload
    if (isMessageFromUser(message, userId)) return result
    if (isViewingConversation(conversationId)) return result

    const conversation = state.communications.conversations.find(
      (item) => item.id === conversationId,
    )
    if (conversation?.mutedBy?.includes(userId)) return result

    const peer = conversation ? getConversationPeer(conversation, userId) : null
    const title = message.senderName || peer?.name || 'Nouveau message'

    store.dispatch(
      addToast({
        id: `ENG-MSG-${message.id}`,
        title,
        message: previewMessage(message),
        tone: 'engagement',
        link: `/messages?conversation=${encodeURIComponent(conversationId)}`,
        engagement: true,
      }),
    )
    return result
  }

  if (action.type === 'communications/receiveRemoteNotification') {
    const notification = action.payload
    if (notification.read) return result

    const link =
      resolveNotificationTarget(notification, state.communications.conversations) ||
      '/notifications'

    store.dispatch(
      addToast({
        id: `ENG-NOTIF-${notification.id}`,
        title: notification.title || 'Nouvelle notification',
        message: notification.message || 'Vous avez une nouvelle alerte.',
        tone: notification.priority === 'high' ? 'warning' : 'engagement',
        link,
        engagement: true,
      }),
    )
    return result
  }

  if (action.type === 'communications/addNotification') {
    const notification = action.payload
    if (notification.userId !== userId) return result
    if (notification.type === 'message') return result

    const link =
      resolveNotificationTarget(notification, state.communications.conversations) ||
      '/notifications'

    store.dispatch(
      addToast({
        id: `ENG-NOTIF-${notification.id}`,
        title: notification.title || 'Nouvelle notification',
        message: notification.message || 'Vous avez une nouvelle alerte.',
        tone: notification.priority === 'high' ? 'warning' : 'engagement',
        link,
        engagement: true,
      }),
    )
  }

  return result
}
