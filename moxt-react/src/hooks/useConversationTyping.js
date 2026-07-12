import { useCallback, useEffect, useRef, useState } from 'react'
import { syncRealtimeAuthToken } from '../services/realtimeService'
import { supabase } from '../services/supabaseClient'

export const TYPING_TTL_MS = 3000
export const TYPING_THROTTLE_MS = 1200
export const STOP_TYPING_DELAY_MS = 2000

export function typingChannelName(conversationId) {
  return `typing:${conversationId}`
}

export function shouldIgnoreTypingEvent(payload, userId) {
  return !payload?.userId || payload.userId === userId
}

export function useConversationTyping(conversationId, userId) {
  const [peerTyping, setPeerTyping] = useState(false)
  const channelRef = useRef(null)
  const readyRef = useRef(false)
  const peerTimeoutRef = useRef(null)
  const lastSentRef = useRef(0)
  const stopTimeoutRef = useRef(null)

  useEffect(() => {
    if (!conversationId || !userId || !supabase) {
      setPeerTyping(false)
      return undefined
    }

    let cancelled = false
    readyRef.current = false

    async function subscribe() {
      await syncRealtimeAuthToken()
      if (cancelled) return

      const channel = supabase.channel(typingChannelName(conversationId), {
        config: { broadcast: { self: false } },
      })

      channel
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (shouldIgnoreTypingEvent(payload, userId)) return
          setPeerTyping(true)
          if (peerTimeoutRef.current) clearTimeout(peerTimeoutRef.current)
          peerTimeoutRef.current = window.setTimeout(() => setPeerTyping(false), TYPING_TTL_MS)
        })
        .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
          if (shouldIgnoreTypingEvent(payload, userId)) return
          setPeerTyping(false)
          if (peerTimeoutRef.current) clearTimeout(peerTimeoutRef.current)
        })
        .subscribe((status) => {
          readyRef.current = status === 'SUBSCRIBED'
        })

      channelRef.current = channel
    }

    void subscribe()

    return () => {
      cancelled = true
      readyRef.current = false
      if (peerTimeoutRef.current) clearTimeout(peerTimeoutRef.current)
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setPeerTyping(false)
    }
  }, [conversationId, userId])

  const broadcast = useCallback(
    (event) => {
      if (!readyRef.current || !channelRef.current) return
      channelRef.current.send({
        type: 'broadcast',
        event,
        payload: { userId },
      })
    },
    [userId],
  )

  const notifyTyping = useCallback(() => {
    if (!conversationId) return

    const now = Date.now()
    if (now - lastSentRef.current >= TYPING_THROTTLE_MS) {
      lastSentRef.current = now
      broadcast('typing')
    }

    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    stopTimeoutRef.current = window.setTimeout(() => {
      broadcast('stop_typing')
    }, STOP_TYPING_DELAY_MS)
  }, [broadcast, conversationId])

  const stopTyping = useCallback(() => {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    broadcast('stop_typing')
  }, [broadcast])

  return { peerTyping, notifyTyping, stopTyping }
}
