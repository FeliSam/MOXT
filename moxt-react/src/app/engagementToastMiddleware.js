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

function isViewingP2pOrder(orderId) {
  if (typeof window === 'undefined' || !orderId) return false
  return window.location.pathname === `/p2p/orders/${orderId}`
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
  const before = store.getState()
  const result = next(action)

  if (!alertsEnabled) return result
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return result

  const state = store.getState()
  const userId = state.auth.user?.id
  if (!userId) return result

  if (action.type === 'p2p/receiveRemoteOrder') {
    const order = action.payload
    if (!order?.id) return result
    if (order.buyerId !== userId && order.sellerId !== userId) return result
    if (isViewingP2pOrder(order.id)) return result

    const previous = before.p2p?.orders?.find((item) => item.id === order.id)
    if (!previous) {
      store.dispatch(
        addToast({
          id: `ENG-P2P-NEW-${order.id}`,
          title: 'Nouvelle commande P2P',
          message: `${order.buyerName || 'Un acheteur'} a accepté une offre.`,
          tone: 'engagement',
          link: `/p2p/orders/${order.id}`,
          engagement: true,
        }),
      )
      return result
    }

    if (previous.status !== order.status) {
      store.dispatch(
        addToast({
          id: `ENG-P2P-STATUS-${order.id}-${order.status}`,
          title: 'Commande P2P mise à jour',
          message: `Statut : ${order.status}`,
          tone: order.status === 'completed' ? 'success' : 'engagement',
          link: `/p2p/orders/${order.id}`,
          engagement: true,
        }),
      )
    }
    return result
  }

  if (action.type === 'p2p/receiveRemoteOffer') {
    const offer = action.payload
    if (!offer?.id || offer.ownerId === userId) return result
    const previous = before.p2p?.offers?.find((item) => item.id === offer.id)
    if (!previous && offer.status === 'active') {
      store.dispatch(
        addToast({
          id: `ENG-P2P-OFFER-${offer.id}`,
          title: 'Nouvelle offre P2P',
          message: `${offer.ownerName || 'Un vendeur'} propose ${offer.amount || ''} ${offer.fromCurrency || ''}`.trim(),
          tone: 'engagement',
          link: `/p2p/${offer.id}`,
          engagement: true,
        }),
      )
    }
    return result
  }

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
