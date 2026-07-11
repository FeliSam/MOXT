import {
  enableEngagementAlerts,
  disableEngagementAlerts,
} from '../app/engagementToastMiddleware'
import { supabase } from './supabaseClient'
import { findConversationByParticipants } from '../features/communications/conversationUtils'
import {
  ensureConversationFromRemote,
  loadConversationMessages,
  receiveRemoteConversation,
  receiveRemoteMessage,
  receiveRemoteNotification,
  syncRemoteConversation,
  normalizeConversation,
  normalizeMessage,
} from '../features/communications/communicationSlice'
import {
  receiveRemoteListing,
  removeRemoteListing,
} from '../features/marketplace/marketplaceSlice'
import { listingFromRemoteRow } from '../features/marketplace/marketplaceRemote'

const camelMap = {
  conversation_id: 'conversationId',
  sender_id: 'senderId',
  sender_name: 'senderName',
  reply_to_id: 'replyToId',
  deleted_by: 'deletedBy',
  delivered_to: 'deliveredTo',
  read_by: 'readBy',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  participant_ids: 'participantIds',
  unread_by: 'unreadBy',
  archived_by: 'archivedBy',
  pinned_by: 'pinnedBy',
  related_id: 'relatedId',
  related_type: 'relatedType',
  related_path: 'relatedPath',
  related_snapshot: 'relatedSnapshot',
  related_contexts: 'relatedContexts',
  created_by: 'createdBy',
}

function parseIdList(value) {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map(String) : value ? [value] : []
    } catch {
      return value ? [value] : []
    }
  }
  return []
}

function fromRow(row) {
  const result = {}
  for (const [key, value] of Object.entries(row)) {
    result[camelMap[key] ?? key] = value
  }
  if (result.participantIds) {
    result.participantIds = parseIdList(result.participantIds)
  }
  return result
}

function resolveConversationForMessage(state, conversationId, participantIds) {
  const byId = state.communications.conversations.find((c) => c.id === conversationId)
  if (byId) return byId
  if (participantIds?.length) {
    return findConversationByParticipants(state.communications.conversations, participantIds)
  }
  return null
}

async function ingestRemoteMessage(conversationId, row, userId, dispatch, getState) {
  let conversation = resolveConversationForMessage(getState(), conversationId)
  let remoteParticipantIds = null

  if (!conversation) {
    await dispatch(ensureConversationFromRemote(conversationId))
    conversation = resolveConversationForMessage(getState(), conversationId)
  }

  if (!conversation && supabase) {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle()
    if (data) {
      const remoteConversation = normalizeConversation({
        ...fromRow(data),
        messages: [],
        messagesLoaded: false,
      })
      remoteParticipantIds = remoteConversation.participantIds
      if (remoteConversation.participantIds.includes(userId)) {
        const duplicate = findConversationByParticipants(
          getState().communications.conversations,
          remoteConversation.participantIds,
        )
        if (duplicate) {
          conversation = duplicate
        } else {
          dispatch(receiveRemoteConversation(remoteConversation))
          conversation = resolveConversationForMessage(
            getState(),
            conversationId,
            remoteConversation.participantIds,
          )
        }
      }
    }
  }

  if (!conversation) {
    conversation = resolveConversationForMessage(getState(), conversationId, remoteParticipantIds)
  }
  if (!conversation) return

  const message = normalizeMessage(fromRow(row))
  const alreadyExists = conversation.messages.some((m) => m.id === message.id)
  if (alreadyExists) return
  dispatch(receiveRemoteMessage({ conversationId: conversation.id, message }))
}

function maybeReloadConversationMessages(conversation, dispatch, getState) {
  const local = resolveConversationForMessage(
    getState(),
    conversation.id,
    conversation.participantIds,
  )
  if (!local?.messagesLoaded) return
  const remoteCount = conversation.messageCount || 0
  const localCount = local.messages?.length || 0
  if (remoteCount > localCount) {
    dispatch(loadConversationMessages(local.id))
  }
}

let channel = null
let activeUserId = null
let reconnectTimer = null

/** Propage le JWT Supabase au socket Realtime (requis pour les événements RLS). */
export async function syncRealtimeAuthToken() {
  if (!supabase) return false
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return false
  await supabase.realtime.setAuth(token)
  return true
}

export async function startRealtimeSubscription(userId, dispatch, getState) {
  if (!supabase || !userId) return

  const authed = await syncRealtimeAuthToken()
  if (!authed) return

  if (channel && activeUserId === userId) return

  if (channel) {
    supabase.removeChannel(channel)
    channel = null
    activeUserId = null
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  activeUserId = userId
  enableEngagementAlerts()

  channel = supabase
    .channel(`user-messaging-${userId}`)

    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        void ingestRemoteMessage(payload.new.conversation_id, payload.new, userId, dispatch, getState)
      },
    )

    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'conversations' },
      (payload) => {
        const row = fromRow(payload.new)
        const conversation = normalizeConversation({ ...row, messages: [] })
        if (!conversation.participantIds.includes(userId)) return
        dispatch(receiveRemoteConversation(conversation))
      },
    )

    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversations' },
      (payload) => {
        const row = fromRow(payload.new)
        const conversation = normalizeConversation({ ...row, messages: [] })
        if (!conversation.participantIds.includes(userId)) return
        dispatch(syncRemoteConversation(conversation))
        maybeReloadConversationMessages(conversation, dispatch, getState)
      },
    )

    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        const row = payload.new
        if (row.user_id !== userId || row.type === 'message') return
        dispatch(
          receiveRemoteNotification({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            message: row.message,
            type: row.type || 'system',
            link: row.link || null,
            read: row.read ?? false,
            archived: row.archived ?? false,
            createdAt: row.created_at,
          }),
        )
      },
    )

    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'listings' },
      (payload) => dispatch(receiveRemoteListing(listingFromRemoteRow(payload.new))),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'listings' },
      (payload) => dispatch(receiveRemoteListing(listingFromRemoteRow(payload.new))),
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'listings' },
      (payload) => dispatch(removeRemoteListing(payload.old.id)),
    )

    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (reconnectTimer) return
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null
          if (activeUserId === userId) {
            channel = null
            void startRealtimeSubscription(userId, dispatch, getState)
          }
        }, 3000)
      }
    })
}

export function stopRealtimeSubscription() {
  disableEngagementAlerts()
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
    activeUserId = null
  }
}
