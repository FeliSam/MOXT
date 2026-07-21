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
  syncRemoteMessage,
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
import { hydrateAccountPreferences } from '../features/account/accountSlice'
import { patchBusiness } from '../features/businesses/businessSlice'
import { businessFromRemoteRow } from '../features/businesses/businessRemote'
import { setOnlineUsers } from '../features/presence/presenceSlice'
import { transferFromRemoteRow } from '../features/transfers/transferRemote'
import { receiveRemoteTransfer } from '../features/transfers/transferSlice'
import {
  isTransferRelevantToUser,
  ownedBusinessIdsForUser,
  shouldAcceptRealtimeListing,
  userParticipatesInConversation,
} from './realtimeFilterUtils'

/** Colonnes conversation pour le fallback fetch (évite select *). */
const CONVERSATION_FALLBACK_SELECT = [
  'id',
  'title',
  'related_type',
  'related_id',
  'related_path',
  'related_snapshot',
  'related_contexts',
  'participant_profiles',
  'participant_ids',
  'participant_key',
  'created_by',
  'status',
  'unread_by',
  'archived_by',
  'pinned_by',
  'muted_by',
  'blocked_by',
  'message_count',
  'last_message_text',
  'last_message_sender_id',
  'last_message_at',
  'created_at',
  'updated_at',
].join(',')

const MAX_TRANSFER_BUSINESS_FILTERS = 8

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

const RECONNECT_DELAY_MS = 3000

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
      .select(CONVERSATION_FALLBACK_SELECT)
      .eq('id', conversationId)
      .maybeSingle()
    if (data) {
      const remoteConversation = normalizeConversation({
        ...fromRow(data),
        messages: [],
        messagesLoaded: false,
      })
      remoteParticipantIds = remoteConversation.participantIds
      if (userParticipatesInConversation(remoteConversation, userId)) {
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
  if (!userParticipatesInConversation(conversation, userId)) return

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
let onlineHandler = null
let connectionStatus = 'idle'
let heartbeatTimer = null

const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000

async function sendActivityHeartbeat(userId) {
  if (!supabase || !userId) return
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId)
}

function startHeartbeat(userId) {
  stopHeartbeat()
  void sendActivityHeartbeat(userId)
  heartbeatTimer = setInterval(() => void sendActivityHeartbeat(userId), HEARTBEAT_INTERVAL_MS)
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

function setConnectionStatus(status) {
  connectionStatus = status
}

export function isRealtimeConnected() {
  return connectionStatus === 'subscribed'
}

export function getRealtimeConnectionStatus() {
  return connectionStatus
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function teardownChannel() {
  stopHeartbeat()
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
  activeUserId = null
  setConnectionStatus('idle')
}

function scheduleReconnect(userId, dispatch, getState) {
  if (reconnectTimer || !userId) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (activeUserId !== userId) return
    channel = null
    void startRealtimeSubscription(userId, dispatch, getState, { force: true })
  }, RECONNECT_DELAY_MS)
}

function ensureOnlineReconnect(userId, dispatch, getState) {
  if (onlineHandler || typeof window === 'undefined') return
  onlineHandler = () => {
    if (!userId) return
    void reconnectRealtimeSubscription(userId, dispatch, getState)
  }
  window.addEventListener('online', onlineHandler)
}

function removeOnlineReconnect() {
  if (!onlineHandler || typeof window === 'undefined') return
  window.removeEventListener('online', onlineHandler)
  onlineHandler = null
}

function bindChannel(userId, dispatch, getState) {
  setConnectionStatus('connecting')

  const handleTransferChange = (payload) => {
    const transfer = transferFromRemoteRow(payload.new)
    if (!transfer?.id) return
    const ownedIds = ownedBusinessIdsForUser(getState().businesses?.items, userId)
    if (!isTransferRelevantToUser(transfer, userId, ownedIds)) return
    dispatch(receiveRemoteTransfer(transfer))
  }

  const handleListingUpsert = (payload) => {
    const listing = listingFromRemoteRow(payload.new)
    if (!listing?.id) return
    if (shouldAcceptRealtimeListing(listing, userId)) {
      dispatch(receiveRemoteListing(listing))
      return
    }
    dispatch(removeRemoteListing(listing.id))
  }

  let nextChannel = supabase
    .channel('presence-online', { config: { presence: { key: userId } } })

    .on('presence', { event: 'sync' }, () => {
      dispatch(setOnlineUsers(Object.keys(channel.presenceState())))
    })

    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        void ingestRemoteMessage(payload.new.conversation_id, payload.new, userId, dispatch, getState)
      },
    )

    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages' },
      (payload) => {
        const row = fromRow(payload.new)
        const conversation = resolveConversationForMessage(
          getState(),
          row.conversationId || payload.new.conversation_id,
        )
        if (!userParticipatesInConversation(conversation, userId)) return
        dispatch(
          syncRemoteMessage({
            ...row,
            conversationId: row.conversationId || payload.new.conversation_id,
          }),
        )
      },
    )

    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'conversations' },
      (payload) => {
        const row = fromRow(payload.new)
        const conversation = normalizeConversation({ ...row, messages: [] })
        if (!userParticipatesInConversation(conversation, userId)) return
        dispatch(receiveRemoteConversation(conversation))
      },
    )

    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversations' },
      (payload) => {
        const row = fromRow(payload.new)
        const conversation = normalizeConversation({ ...row, messages: [] })
        if (!userParticipatesInConversation(conversation, userId)) return
        dispatch(syncRemoteConversation(conversation))
        maybeReloadConversationMessages(conversation, dispatch, getState)
      },
    )

    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new
        if (String(row.user_id) !== String(userId) || row.type === 'message') return
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
      {
        event: '*',
        schema: 'public',
        table: 'transfers',
        filter: `user_id=eq.${userId}`,
      },
      handleTransferChange,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transfers',
        filter: `business_owner_id=eq.${userId}`,
      },
      handleTransferChange,
    )

  const ownedBusinessIds = ownedBusinessIdsForUser(
    getState().businesses?.items,
    userId,
  ).slice(0, MAX_TRANSFER_BUSINESS_FILTERS)
  for (const businessId of ownedBusinessIds) {
    nextChannel = nextChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transfers',
        filter: `business_id=eq.${businessId}`,
      },
      handleTransferChange,
    )
  }

  channel = nextChannel
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'listings' },
      handleListingUpsert,
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'listings' },
      handleListingUpsert,
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'listings' },
      (payload) => dispatch(removeRemoteListing(payload.old.id)),
    )

    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const visibility = payload.new?.activity_visibility
        const remotePrefs = payload.new?.preferences
        const preferences =
          remotePrefs && typeof remotePrefs === 'object' && !Array.isArray(remotePrefs)
            ? remotePrefs
            : typeof remotePrefs === 'string'
              ? (() => {
                  try {
                    const parsed = JSON.parse(remotePrefs)
                    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
                  } catch {
                    return {}
                  }
                })()
              : {}
        if (!visibility && !Object.keys(preferences).length) return
        dispatch(
          hydrateAccountPreferences({
            userId,
            fromRemote: true,
            preferences: {
              ...preferences,
              ...(visibility ? { activityVisibility: visibility } : {}),
            },
          }),
        )
      },
    )

    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'businesses',
        filter: `owner_id=eq.${userId}`,
      },
      (payload) => {
        const remote = businessFromRemoteRow(payload.new)
        if (!remote?.id) return
        dispatch(
          patchBusiness({
            id: remote.id,
            patch: {
              activityVisibility: remote.activityVisibility || 'public',
              updatedAt: remote.updatedAt || new Date().toISOString(),
            },
          }),
        )
      },
    )

    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearReconnectTimer()
        setConnectionStatus('subscribed')
        void channel.track({ online_at: new Date().toISOString() })
        startHeartbeat(userId)
        return
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnectionStatus(status === 'CLOSED' ? 'closed' : 'error')
        channel = null
        stopHeartbeat()
        scheduleReconnect(userId, dispatch, getState)
      }
    })
}

/** Propage le JWT Supabase au socket Realtime (requis pour les événements RLS). */
export async function syncRealtimeAuthToken() {
  if (!supabase) return false
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return false
  await supabase.realtime.setAuth(token)
  return true
}

export async function startRealtimeSubscription(userId, dispatch, getState, options = {}) {
  const { force = false } = options
  if (!supabase || !userId) return

  const authed = await syncRealtimeAuthToken()
  if (!authed) return

  if (!force && channel && activeUserId === userId && connectionStatus === 'subscribed') {
    return
  }

  clearReconnectTimer()
  teardownChannel()

  activeUserId = userId
  enableEngagementAlerts()
  ensureOnlineReconnect(userId, dispatch, getState)
  bindChannel(userId, dispatch, getState)
}

export function reconnectRealtimeSubscription(userId, dispatch, getState) {
  return startRealtimeSubscription(userId, dispatch, getState, { force: true })
}

export function stopRealtimeSubscription() {
  disableEngagementAlerts()
  removeOnlineReconnect()
  clearReconnectTimer()
  teardownChannel()
}
