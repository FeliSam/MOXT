import { useEffect } from 'react'
import { useDispatch, useStore } from 'react-redux'
import {
  loadConversationMessages,
  refreshConversations,
} from '../features/communications/communicationSlice'
import {
  isRealtimeConnected,
  reconnectRealtimeSubscription,
} from '../services/realtimeService'

/** Safety net only when realtime is down — avoid redundant polling while connected. */
const POLL_DEGRADED_MS = 12000

export function useMessagesRealtimeSync(activeConversationId) {
  const dispatch = useDispatch()
  const store = useStore()

  useEffect(() => {
    const userId = store.getState().auth.user?.id
    if (!userId) return undefined

    let cancelled = false

    async function syncInbox() {
      if (cancelled) return

      if (!isRealtimeConnected()) {
        await reconnectRealtimeSubscription(userId, store.dispatch, store.getState)
      }

      await dispatch(refreshConversations())

      if (!activeConversationId || cancelled) return

      const conversation = store
        .getState()
        .communications.conversations.find((item) => item.id === activeConversationId)
      if (!conversation) return

      const loadedCount = conversation.messages?.length || 0
      const expectedCount = conversation.messageCount || 0
      const needsReload =
        !conversation.messagesLoaded ||
        (expectedCount > 0 && loadedCount < expectedCount)

      if (needsReload && !conversation.messagesLoading) {
        await dispatch(loadConversationMessages(activeConversationId))
      }
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
  }, [activeConversationId, dispatch, store])
}
