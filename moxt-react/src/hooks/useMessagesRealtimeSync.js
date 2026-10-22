import { useEffect } from 'react'
import { useDispatch, useStore } from 'react-redux'
import {
  conversationNeedsInitialMessageLoad,
  loadConversationMessages,
  refreshConversations,
} from '../features/communications/communicationSlice'
import {
  isRealtimeConnected,
  reconnectRealtimeSubscription,
  shouldAttemptRealtimeReconnect,
} from '../services/realtimeService'

/** Safety net only when realtime is down — avoid redundant polling while connected. */
const POLL_DEGRADED_MS = 12000

export function useMessagesRealtimeSync(activeConversationId) {
  const dispatch = useDispatch()
  const store = useStore()

  // Synchronisation de la boîte de réception au montage et en mode dégradé (hors changement de chat)
  useEffect(() => {
    const userId = store.getState().auth.user?.id
    if (!userId) return undefined

    let cancelled = false

    async function syncInbox() {
      if (cancelled) return

      if (shouldAttemptRealtimeReconnect()) {
        await reconnectRealtimeSubscription(userId, store.dispatch, store.getState)
      }

      await dispatch(refreshConversations())
    }

    void syncInbox()

    const degradedId = window.setInterval(() => {
      if (isRealtimeConnected()) return
      void syncInbox()
    }, POLL_DEGRADED_MS)

    return () => {
      cancelled = true
      window.clearInterval(degradedId)
    }
  }, [dispatch, store])

  // Chargement direct des messages de la conversation active dès le clic (sans attendre refreshConversations)
  useEffect(() => {
    if (!activeConversationId) return

    const conversation = store
      .getState()
      .communications.conversations.find((item) => item.id === activeConversationId)
    if (!conversation) return

    if (
      conversationNeedsInitialMessageLoad(conversation) &&
      !conversation.messagesLoading
    ) {
      void dispatch(loadConversationMessages(activeConversationId))
    }
  }, [activeConversationId, dispatch, store])
}
