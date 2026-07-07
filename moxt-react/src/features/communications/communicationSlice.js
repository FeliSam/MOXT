import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { fetchUserConversations } from '@moxt/shared/utils/fetchUserConversations.js'
import { supabase } from '../../services/supabaseClient'
import { fromRow, fromRows } from '../../services/remoteRowMapper'
import { createLocalStorage } from '../../services/createLocalStorage'
import { findConversationByParticipants, participantKey } from './conversationUtils'
import { persistConversationRemote, resolveMessageLoadScope } from './conversationPersist'
import {
  buildParticipantProfilesMap,
  fetchParticipantProfilesFromRemote,
  formatProfileName,
  mergeParticipantProfiles,
} from './conversationDisplay'
import { appendRelatedContext, findRelatedContext, hasRelatedContext, mergeRelatedContextArrays, normalizeRelatedContexts } from './conversationTimeline'

const PENDING_MESSAGE_MS = 15000

const conversationsStorage = createLocalStorage('moxt-conversations-v1')
const supportStorage = createLocalStorage('moxt-support-v1')
const notificationsStorage = createLocalStorage('moxt-notifications-v1')

function parseIdList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : value ? [value] : []
    } catch {
      return value ? [value] : []
    }
  }
  return []
}

function parseRecord(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

function parseJsonValue(value, fallback) {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return fallback
}

export function normalizeMessage(message) {
  if (!message) return message
  return {
    ...message,
    senderId: String(message.senderId ?? message.sender_id ?? ''),
    senderName: message.senderName ?? message.sender_name ?? '',
    attachment: parseJsonValue(message.attachment, null),
    reactions: parseJsonValue(message.reactions, {}),
    deletedBy: parseIdList(message.deletedBy ?? message.deleted_by),
    deliveredTo: parseIdList(message.deliveredTo ?? message.delivered_to),
    readBy: parseIdList(message.readBy ?? message.read_by),
  }
}

export function normalizeConversation(conv) {
  if (!conv) return conv
  const relatedSnapshot = parseJsonValue(
    conv.relatedSnapshot ?? conv.related_snapshot,
    conv.relatedSnapshot ?? conv.related_snapshot ?? null,
  )
  const relatedContexts = parseJsonValue(
    conv.relatedContexts ?? conv.related_contexts,
    conv.relatedContexts ?? conv.related_contexts ?? [],
  )
  const base = {
    ...conv,
    participantIds: parseIdList(conv.participantIds ?? conv.participant_ids).map(String),
    unreadBy: parseRecord(conv.unreadBy ?? conv.unread_by),
    archivedBy: parseIdList(conv.archivedBy ?? conv.archived_by),
    pinnedBy: parseIdList(conv.pinnedBy ?? conv.pinned_by),
    mutedBy: parseIdList(conv.mutedBy ?? conv.muted_by),
    blockedBy: parseIdList(conv.blockedBy ?? conv.blocked_by),
    relatedSnapshot,
    participantProfiles: parseJsonValue(
      conv.participantProfiles ?? conv.participant_profiles,
      conv.participantProfiles ?? conv.participant_profiles ?? {},
    ),
    messages: Array.isArray(conv.messages) ? conv.messages : [],
    messagesLoaded: conv.messagesLoaded ?? false,
    messagesLoading: conv.messagesLoading ?? false,
    messageCount: Math.max(
      Number(conv.messageCount) || 0,
      Array.isArray(conv.messages) ? conv.messages.length : 0,
    ),
  }
  return {
    ...base,
    relatedContexts: normalizeRelatedContexts({ ...base, relatedContexts }),
  }
}

function preservedLocalMessages(conversation) {
  if (conversation.messagesLoaded || (conversation.messages?.length ?? 0) > 0) {
    return conversation.messages || []
  }
  return []
}

function mergeConversationRelatedFields(remoteConv, localConv) {
  const relatedContexts = mergeRelatedContextArrays(
    remoteConv.relatedContexts,
    localConv.relatedContexts,
  )
  return {
    relatedType: remoteConv.relatedType || localConv.relatedType,
    relatedId: remoteConv.relatedId || localConv.relatedId,
    relatedPath: remoteConv.relatedPath || localConv.relatedPath,
    relatedSnapshot: remoteConv.relatedSnapshot || localConv.relatedSnapshot,
    relatedContexts: relatedContexts.length
      ? relatedContexts
      : normalizeRelatedContexts({
          ...remoteConv,
          relatedType: remoteConv.relatedType || localConv.relatedType,
          relatedId: remoteConv.relatedId || localConv.relatedId,
          relatedPath: remoteConv.relatedPath || localConv.relatedPath,
          relatedSnapshot: remoteConv.relatedSnapshot || localConv.relatedSnapshot,
        }),
  }
}

export function mergeConversations(localConversations, remoteConversations) {
  const byId = new Map(
    remoteConversations.map((conv) => [conv.id, normalizeConversation(conv)]),
  )

  for (const localConv of localConversations.map(normalizeConversation)) {
    const remoteConv = byId.get(localConv.id)
    if (remoteConv) {
      byId.set(localConv.id, normalizeConversation({
        ...remoteConv,
        ...mergeConversationRelatedFields(remoteConv, localConv),
        messages: preservedLocalMessages(localConv),
        messagesLoaded:
          localConv.messagesLoaded ?? (localConv.messages?.length ?? 0) > 0,
        messagesLoading: localConv.messagesLoading ?? false,
        drafts: localConv.drafts ?? remoteConv.drafts,
        unreadBy: { ...remoteConv.unreadBy, ...localConv.unreadBy },
        archivedBy: localConv.archivedBy?.length ? localConv.archivedBy : remoteConv.archivedBy,
        pinnedBy: localConv.pinnedBy?.length ? localConv.pinnedBy : remoteConv.pinnedBy,
        mutedBy: localConv.mutedBy?.length ? localConv.mutedBy : remoteConv.mutedBy,
        blockedBy: localConv.blockedBy?.length ? localConv.blockedBy : remoteConv.blockedBy,
      }))
    } else {
      byId.set(localConv.id, localConv)
    }
  }

  const byParticipant = new Map()
  for (const conv of byId.values()) {
    const key = participantKey(conv.participantIds)
    const existing = byParticipant.get(key)
    if (!existing) {
      byParticipant.set(key, conv)
      continue
    }
    const newer =
      new Date(conv.updatedAt) >= new Date(existing.updatedAt) ? conv : existing
    const older = newer === conv ? existing : conv
    byParticipant.set(key, normalizeConversation({
      ...newer,
      ...mergeConversationRelatedFields(newer, older),
      messages: preservedLocalMessages(newer).length
        ? preservedLocalMessages(newer)
        : preservedLocalMessages(older),
      messagesLoaded:
        newer.messagesLoaded ||
        older.messagesLoaded ||
        (newer.messages?.length ?? 0) > 0 ||
        (older.messages?.length ?? 0) > 0,
      messagesLoading: newer.messagesLoading || older.messagesLoading,
      messageCount: Math.max(newer.messageCount || 0, older.messageCount || 0),
      unreadBy: { ...older.unreadBy, ...newer.unreadBy },
      drafts: { ...older.drafts, ...newer.drafts },
    }))
  }

  return [...byParticipant.values()].sort(
    (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt),
  )
}

function bumpConversationToTop(state, conversationId) {
  const index = state.conversations.findIndex((item) => item.id === conversationId)
  if (index > 0) {
    const [conversation] = state.conversations.splice(index, 1)
    state.conversations.unshift(conversation)
  }
}

const communicationSlice = createSlice({
  name: 'communications',
  initialState: {
    conversations: conversationsStorage.read().map(normalizeConversation),
    support: supportStorage.read(),
    notifications: notificationsStorage.read(),
  },
  reducers: {
    setAll(state, action) {
      const payload = { ...action.payload }
      if (payload.conversations) {
        payload.conversations = payload.conversations.map(normalizeConversation)
      }
      Object.assign(state, payload)
    },
    receiveRemoteMessage(state, action) {
      const { conversationId, message } = action.payload
      const conversation = state.conversations.find((c) => c.id === conversationId)
      if (!conversation) return
      const normalizedMessage = normalizeMessage(message)
      const alreadyExists = conversation.messages.some((m) => m.id === normalizedMessage.id)
      if (alreadyExists) return
      conversation.messages.push(normalizedMessage)
      conversation.messagesLoaded = true
      conversation.messageCount = conversation.messages.length
      conversation.updatedAt = normalizedMessage.createdAt
      conversation.participantIds = parseIdList(conversation.participantIds)
      conversation.unreadBy ||= {}
      conversation.participantIds
        .filter((participantId) => participantId !== normalizedMessage.senderId)
        .forEach((participantId) => {
          conversation.unreadBy[participantId] = (conversation.unreadBy[participantId] || 0) + 1
        })
      bumpConversationToTop(state, conversationId)
    },
    receiveRemoteConversation(state, action) {
      const conversation = normalizeConversation(action.payload)
      const duplicate = findConversationByParticipants(
        state.conversations,
        conversation.participantIds,
      )
      if (duplicate && duplicate.id !== conversation.id) {
        const index = state.conversations.findIndex((item) => item.id === duplicate.id)
        const existing = normalizeConversation(state.conversations[index])
        state.conversations[index] = {
          ...existing,
          ...conversation,
          id: existing.id,
          messages: existing.messages,
          messagesLoaded: existing.messagesLoaded,
          messagesLoading: existing.messagesLoading,
        }
        bumpConversationToTop(state, existing.id)
        return
      }
      const exists = state.conversations.some((c) => c.id === conversation.id)
      if (!exists) state.conversations.unshift(conversation)
    },
    syncRemoteConversation(state, action) {
      const incoming = normalizeConversation(action.payload)
      const index = state.conversations.findIndex((item) => item.id === incoming.id)
      if (index < 0) {
        const duplicate = findConversationByParticipants(
          state.conversations,
          incoming.participantIds,
        )
        if (duplicate) {
          const dupIndex = state.conversations.findIndex((item) => item.id === duplicate.id)
          const existing = normalizeConversation(state.conversations[dupIndex])
          state.conversations[dupIndex] = {
            ...existing,
            ...incoming,
            id: existing.id,
            messages: existing.messages,
            messagesLoaded: existing.messagesLoaded,
            messagesLoading: existing.messagesLoading,
            unreadBy: { ...incoming.unreadBy, ...existing.unreadBy },
            messageCount: Math.max(
              existing.messageCount || 0,
              incoming.messageCount || existing.messages.length,
            ),
          }
          bumpConversationToTop(state, existing.id)
          return
        }
        state.conversations.unshift(incoming)
        return
      }
      const existing = normalizeConversation(state.conversations[index])
      state.conversations[index] = {
        ...existing,
        ...incoming,
        messages: existing.messages,
        messagesLoaded: existing.messagesLoaded,
        messagesLoading: existing.messagesLoading,
        unreadBy: { ...incoming.unreadBy, ...existing.unreadBy },
        messageCount: Math.max(
          existing.messageCount || 0,
          incoming.messageCount || existing.messages.length,
        ),
      }
      bumpConversationToTop(state, incoming.id)
    },
    replaceConversationId(state, action) {
      const { fromId, conversation } = action.payload
      const fromIndex = state.conversations.findIndex((item) => item.id === fromId)
      const keeper = normalizeConversation(conversation)
      const keeperIndex = state.conversations.findIndex((item) => item.id === keeper.id)

      if (fromIndex < 0) {
        if (keeperIndex < 0) state.conversations.unshift(keeper)
        return
      }

      const local = normalizeConversation(state.conversations[fromIndex])
      const merged = {
        ...keeper,
        messages: local.messages?.length ? local.messages : keeper.messages,
        messagesLoaded: local.messagesLoaded || keeper.messagesLoaded,
        messagesLoading: local.messagesLoading || keeper.messagesLoading,
        drafts: { ...keeper.drafts, ...local.drafts },
        unreadBy: { ...keeper.unreadBy, ...local.unreadBy },
      }

      if (keeperIndex >= 0 && keeperIndex !== fromIndex) {
        state.conversations[keeperIndex] = merged
        state.conversations.splice(fromIndex, 1)
      } else {
        state.conversations[fromIndex] = merged
      }
      bumpConversationToTop(state, merged.id)
    },
    updateConversationContext(state, action) {
      const conversation = state.conversations.find((item) => item.id === action.payload.id)
      if (!conversation) return
      if (action.payload.relatedType) conversation.relatedType = action.payload.relatedType
      if (action.payload.relatedId) conversation.relatedId = action.payload.relatedId
      if (action.payload.relatedPath) conversation.relatedPath = action.payload.relatedPath
      if (action.payload.relatedSnapshot !== undefined) {
        conversation.relatedSnapshot = action.payload.relatedSnapshot
        const withContext = appendRelatedContext(conversation, {
          relatedType: action.payload.relatedType || conversation.relatedType,
          relatedId: action.payload.relatedId || conversation.relatedId,
          relatedPath: action.payload.relatedPath || conversation.relatedPath,
          relatedSnapshot: action.payload.relatedSnapshot,
          introducedBy: action.payload.introducedBy,
        })
        conversation.relatedContexts = withContext.relatedContexts
      }
      conversation.updatedAt = new Date().toISOString()
    },
    mergeConversationParticipantProfiles(state, action) {
      const conversation = state.conversations.find((item) => item.id === action.payload.id)
      if (!conversation || !action.payload.participantProfiles) return
      conversation.participantProfiles = mergeParticipantProfiles(
        conversation.participantProfiles,
        action.payload.participantProfiles,
      )
    },
    createConversation: {
      reducer(state, action) {
        const payload = normalizeConversation(action.payload)
        if (new Set(payload.participantIds).size < 2) return
        const existing = findConversationByParticipants(state.conversations, payload.participantIds)
        if (existing) {
          const index = state.conversations.findIndex((item) => item.id === existing.id)
          let merged = {
            ...state.conversations[index],
            relatedType: payload.relatedType || state.conversations[index].relatedType,
            relatedId: payload.relatedId || state.conversations[index].relatedId,
            relatedPath: payload.relatedPath || state.conversations[index].relatedPath,
            relatedSnapshot: payload.relatedSnapshot ?? state.conversations[index].relatedSnapshot,
            participantProfiles: mergeParticipantProfiles(
              state.conversations[index].participantProfiles,
              payload.participantProfiles,
            ),
            updatedAt: new Date().toISOString(),
          }
          if (payload.relatedSnapshot && payload.relatedId) {
            merged = appendRelatedContext(merged, {
              relatedType: payload.relatedType,
              relatedId: payload.relatedId,
              relatedPath: payload.relatedPath,
              relatedSnapshot: payload.relatedSnapshot,
              introducedBy: payload.createdBy,
            })
          }
          state.conversations[index] = merged
          bumpConversationToTop(state, existing.id)
          return
        }
        state.conversations.unshift(payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        let payload = {
          id: `CONV-${Date.now().toString(36).toUpperCase()}`,
          title: values.title,
          relatedType: values.relatedType || 'general',
          relatedId: values.relatedId || null,
          relatedPath: values.relatedPath || null,
          relatedSnapshot: values.relatedSnapshot || null,
          participantProfiles: values.participantProfiles || {},
          participantIds: [...new Set(values.participantIds)],
          createdBy: values.createdBy,
          status: 'active',
          unreadBy: Object.fromEntries(
            values.participantIds.map((participantId) => [participantId, 0]),
          ),
          messages: values.initialMessage
            ? [
                {
                  id: `MSG-${Date.now().toString(36).toUpperCase()}`,
                  senderId: values.createdBy,
                  senderName: values.senderName,
                  text: values.initialMessage,
                  createdAt: now,
                },
              ]
            : [],
          messageCount: values.initialMessage ? 1 : 0,
          messagesLoaded: Boolean(values.initialMessage),
          createdAt: now,
          updatedAt: now,
        }
        if (values.relatedSnapshot && values.relatedId) {
          payload = appendRelatedContext(payload, {
            relatedType: values.relatedType,
            relatedId: values.relatedId,
            relatedPath: values.relatedPath,
            relatedSnapshot: values.relatedSnapshot,
            introducedBy: values.createdBy,
            introducedAt: now,
          })
        }
        return { payload }
      },
    },
    sendMessage: {
      reducer(state, action) {
        const conversation = state.conversations.find(
          (item) => item.id === action.payload.conversationId,
        )
        if (!conversation) return
        const participantIds = parseIdList(conversation.participantIds).map(String)
        const senderId = String(action.payload.senderId)
        if (!participantIds.includes(senderId)) return
        conversation.participantIds = participantIds
        conversation.messages.push({
          ...action.payload.message,
          senderId: String(action.payload.message.senderId ?? senderId),
        })
        conversation.messagesLoaded = true
        conversation.messageCount = conversation.messages.length
        conversation.updatedAt = action.payload.message.createdAt
        conversation.participantIds
          .filter((participantId) => participantId !== senderId)
          .forEach((participantId) => {
            conversation.unreadBy ||= {}
            conversation.unreadBy[participantId] = (conversation.unreadBy[participantId] || 0) + 1
          })
        bumpConversationToTop(state, action.payload.conversationId)
      },
      prepare({ attachment, conversationId, relatedContextId, replyToId, senderId, senderName, text }) {
        return {
          payload: {
            conversationId,
            senderId,
            message: {
              id: `MSG-${Date.now().toString(36).toUpperCase()}`,
              senderId,
              senderName,
              text: text.trim(),
              attachment: attachment || null,
              replyToId: replyToId || null,
              relatedContextId: relatedContextId || null,
              reactions: {},
              deletedBy: [],
              deliveredTo: [],
              readBy: [senderId],
              createdAt: new Date().toISOString(),
            },
          },
        }
      },
    },
    markConversationRead(state, action) {
      const conversation = state.conversations.find(
        (item) => item.id === action.payload.conversationId,
      )
      if (!conversation || !conversation.participantIds.includes(action.payload.userId)) return
      conversation.unreadBy ||= {}
      conversation.unreadBy[action.payload.userId] = 0
      conversation.messages.forEach((message) => {
        message.deliveredTo ||= []
        message.readBy ||= [message.senderId]
        if (String(message.senderId) !== String(action.payload.userId)) {
          if (!message.deliveredTo.includes(action.payload.userId)) {
            message.deliveredTo.push(action.payload.userId)
          }
          if (!message.readBy.includes(action.payload.userId)) {
            message.readBy.push(action.payload.userId)
          }
        }
      })
    },
    archiveConversation(state, action) {
      const conversation = state.conversations.find((item) => item.id === action.payload.id)
      if (!conversation || !conversation.participantIds.includes(action.payload.userId)) return
      conversation.archivedBy ||= []
      if (!conversation.archivedBy.includes(action.payload.userId)) {
        conversation.archivedBy.push(action.payload.userId)
      }
    },
    restoreConversation(state, action) {
      const conversation = state.conversations.find((item) => item.id === action.payload.id)
      if (!conversation || !conversation.participantIds.includes(action.payload.userId)) return
      conversation.archivedBy = (conversation.archivedBy || []).filter(
        (id) => id !== action.payload.userId,
      )
    },
    toggleConversationPin(state, action) {
      const conversation = state.conversations.find((item) => item.id === action.payload.id)
      if (!conversation || !conversation.participantIds.includes(action.payload.userId)) return
      conversation.pinnedBy ||= []
      conversation.pinnedBy = conversation.pinnedBy.includes(action.payload.userId)
        ? conversation.pinnedBy.filter((id) => id !== action.payload.userId)
        : [...conversation.pinnedBy, action.payload.userId]
    },
    toggleConversationMute(state, action) {
      const conversation = state.conversations.find((item) => item.id === action.payload.id)
      if (!conversation || !conversation.participantIds.includes(action.payload.userId)) return
      conversation.mutedBy ||= []
      conversation.mutedBy = conversation.mutedBy.includes(action.payload.userId)
        ? conversation.mutedBy.filter((id) => id !== action.payload.userId)
        : [...conversation.mutedBy, action.payload.userId]
    },
    saveConversationDraft(state, action) {
      const conversation = state.conversations.find((item) => item.id === action.payload.id)
      if (!conversation || !conversation.participantIds.includes(action.payload.userId)) return
      conversation.drafts ||= {}
      conversation.drafts[action.payload.userId] = action.payload.text
    },
    reactToMessage(state, action) {
      const conversation = state.conversations.find(
        (item) => item.id === action.payload.conversationId,
      )
      const message = conversation?.messages.find((item) => item.id === action.payload.messageId)
      if (!message || !conversation.participantIds.includes(action.payload.userId)) return
      message.reactions ||= {}
      const users = message.reactions[action.payload.reaction] || []
      message.reactions[action.payload.reaction] = users.includes(action.payload.userId)
        ? users.filter((id) => id !== action.payload.userId)
        : [...users, action.payload.userId]
    },
    deleteMessageLocally(state, action) {
      const conversation = state.conversations.find(
        (item) => item.id === action.payload.conversationId,
      )
      const message = conversation?.messages.find((item) => item.id === action.payload.messageId)
      if (!message || !conversation.participantIds.includes(action.payload.userId)) return
      message.deletedBy ||= []
      if (!message.deletedBy.includes(action.payload.userId)) {
        message.deletedBy.push(action.payload.userId)
      }
    },
    toggleConversationBlock(state, action) {
      const conversation = state.conversations.find((item) => item.id === action.payload.id)
      if (!conversation || !conversation.participantIds.includes(action.payload.userId)) return
      conversation.blockedBy ||= []
      conversation.blockedBy = conversation.blockedBy.includes(action.payload.userId)
        ? conversation.blockedBy.filter((id) => id !== action.payload.userId)
        : [...conversation.blockedBy, action.payload.userId]
    },
    createSupportTicket: {
      reducer(state, action) {
        state.support.unshift(action.payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        return {
          payload: {
            id: `SUP-${Date.now().toString(36).toUpperCase()}`,
            userId: values.userId,
            userName: values.userName,
            subject: values.subject.trim(),
            priority: values.priority,
            status: 'waiting_agent',
            messages: [
              {
                id: `SUPMSG-${Date.now().toString(36).toUpperCase()}`,
                senderId: values.userId,
                senderName: values.userName,
                role: 'user',
                text: values.message.trim(),
                createdAt: now,
              },
            ],
            createdAt: now,
            updatedAt: now,
          },
        }
      },
    },
    replySupportTicket(state, action) {
      const ticket = state.support.find((item) => item.id === action.payload.ticketId)
      if (!ticket) return
      const now = new Date().toISOString()
      ticket.messages.push({
        id: `SUPMSG-${Date.now().toString(36).toUpperCase()}`,
        senderId: action.payload.senderId,
        senderName: action.payload.senderName,
        role: action.payload.role,
        text: action.payload.text.trim(),
        createdAt: now,
      })
      ticket.status = action.payload.role === 'agent' ? 'waiting_user' : 'waiting_agent'
      ticket.updatedAt = now
    },
    updateSupportStatus(state, action) {
      const ticket = state.support.find((item) => item.id === action.payload.id)
      if (!ticket) return
      ticket.status = action.payload.status
      ticket.updatedAt = new Date().toISOString()
    },
    addNotification: {
      reducer(state, action) {
        state.notifications.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: `NOT-${Date.now().toString(36).toUpperCase()}`,
            userId: values.userId,
            title: values.title,
            message: values.message,
            type: values.type || 'system',
            link: values.link || null,
            read: false,
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    markNotificationRead(state, action) {
      const notification = state.notifications.find((item) => item.id === action.payload)
      if (notification) notification.read = true
    },
    markAllNotificationsRead(state, action) {
      state.notifications
        .filter((item) => item.userId === action.payload)
        .forEach((item) => {
          item.read = true
        })
    },
    archiveNotification(state, action) {
      const notification = state.notifications.find(
        (item) => item.id === action.payload.id && item.userId === action.payload.userId,
      )
      if (notification) notification.archived = true
    },
    receiveRemoteNotification(state, action) {
      if (action.payload.type === 'message') return
      const exists = state.notifications.some((n) => n.id === action.payload.id)
      if (!exists) state.notifications.unshift(action.payload)
    },
    setConversationMessages(state, action) {
      const conversation =
        state.conversations.find((c) => c.id === action.payload.conversationId) ||
        findConversationByParticipants(
          state.conversations,
          action.payload.participantIds || [],
        )
      if (!conversation) return
      const remoteMessages = (action.payload.messages || []).map(normalizeMessage)
      const remoteIds = new Set(remoteMessages.map((message) => message.id))
      const now = Date.now()
      const localOnly = conversation.messages.filter(
        (message) =>
          !remoteIds.has(message.id) &&
          now - new Date(message.createdAt).getTime() < PENDING_MESSAGE_MS,
      )
      conversation.messages = [...remoteMessages, ...localOnly].sort(
        (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
      )
      conversation.messageCount = conversation.messages.length
      conversation.messagesLoaded = true
      conversation.messagesLoading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('communications/loadConversationMessages/pending', (state, action) => {
        const conversation = state.conversations.find((c) => c.id === action.meta.arg)
        if (conversation) conversation.messagesLoading = true
      })
      .addCase('communications/loadConversationMessages/fulfilled', (state, action) => {
        const conversation = state.conversations.find(
          (c) => c.id === action.payload.conversationId,
        )
        if (conversation) conversation.messagesLoading = false
      })
      .addCase('communications/loadConversationMessages/rejected', (state, action) => {
        const conversation = state.conversations.find((c) => c.id === action.meta.arg)
        if (conversation) {
          conversation.messagesLoading = false
          conversation.messagesLoaded = false
        }
      })
      .addCase('communications/loadParticipantProfiles/fulfilled', (state, action) => {
        const profiles = action.payload || {}
        if (!Object.keys(profiles).length) return
        for (const conversation of state.conversations) {
          const merged = mergeParticipantProfiles(conversation.participantProfiles, profiles)
          if (JSON.stringify(merged) !== JSON.stringify(conversation.participantProfiles)) {
            conversation.participantProfiles = merged
          }
        }
      })
  },
})

export const loadConversationMessages = createAsyncThunk(
  'communications/loadConversationMessages',
  async (conversationId, { dispatch, getState }) => {
    const localConversation = getState().communications.conversations.find(
      (item) => item.id === conversationId,
    )
    const { canonicalId, conversationIds, remoteRow } = await resolveMessageLoadScope(
      conversationId,
      localConversation,
    )

    if (canonicalId !== conversationId && remoteRow) {
      dispatch(
        replaceConversationId({
          fromId: conversationId,
          conversation: normalizeConversation({
            ...fromRow(remoteRow),
            messages: localConversation?.messages || [],
            messagesLoaded: localConversation?.messagesLoaded ?? false,
            messagesLoading: localConversation?.messagesLoading ?? false,
            drafts: localConversation?.drafts,
          }),
        }),
      )
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true })
      .limit(200)
    if (error) throw error

    const messagesById = new Map()
    for (const row of data || []) {
      const message = normalizeMessage(fromRow(row))
      messagesById.set(message.id, message)
    }
    const messages = [...messagesById.values()].sort(
      (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
    )

    dispatch(
      setConversationMessages({
        conversationId: canonicalId,
        messages,
      }),
    )
    return { conversationId: canonicalId, count: messages.length }
  },
)

function buildContactOpenResult(conversation, relatedType, relatedId, contextAlreadyLinked) {
  const normalized = normalizeConversation(conversation)
  const context = findRelatedContext(normalized, relatedType, relatedId)
  return {
    conversation: normalized,
    replyToContextId: context?.id || null,
    contextAlreadyLinked,
  }
}

export const loadParticipantProfiles = createAsyncThunk(
  'communications/loadParticipantProfiles',
  async (participantIds) => fetchParticipantProfilesFromRemote(participantIds),
)

export const openConversationWithContact = createAsyncThunk(
  'communications/openConversationWithContact',
  async (
    {
      ownerId,
      relatedType,
      relatedId,
      relatedPath,
      relatedSnapshot,
      createdBy,
      senderName,
      contactProfile,
    },
    { dispatch, getState },
  ) => {
    const participantIds = [createdBy, ownerId]
    const currentUser = getState().auth.user
    const remoteProfiles = await fetchParticipantProfilesFromRemote(participantIds)
    const participantProfiles = buildParticipantProfilesMap({
      participantIds,
      remoteProfiles,
      currentUser,
      ownerId,
      contactProfile,
    })
    const peerTitle = formatProfileName(participantProfiles[ownerId]) || 'Utilisateur'

    let conversation = findConversationByParticipants(
      getState().communications.conversations,
      participantIds,
    )

    const contextPatch = {
      relatedType,
      relatedId,
      relatedPath,
      relatedSnapshot,
    }

    if (conversation) {
      const contextAlreadyLinked = hasRelatedContext(conversation, relatedType, relatedId)
      if (!contextAlreadyLinked) {
        dispatch(
          updateConversationContext({
            id: conversation.id,
            ...contextPatch,
            introducedBy: createdBy,
          }),
        )
      }
      dispatch(
        mergeConversationParticipantProfiles({
          id: conversation.id,
          participantProfiles,
        }),
      )
      return buildContactOpenResult(
        getState().communications.conversations.find((c) => c.id === conversation.id),
        relatedType,
        relatedId,
        contextAlreadyLinked,
      )
    }

    const key = participantKey(participantIds)
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('participant_key', key)
      .maybeSingle()
    if (error) throw error

    if (data) {
      conversation = normalizeConversation({
        ...fromRow(data),
        messages: [],
        messagesLoaded: false,
      })
      dispatch(receiveRemoteConversation(conversation))
      const contextAlreadyLinked = hasRelatedContext(conversation, relatedType, relatedId)
      if (!contextAlreadyLinked) {
        dispatch(
          updateConversationContext({
            id: conversation.id,
            ...contextPatch,
            introducedBy: createdBy,
          }),
        )
      }
      dispatch(
        mergeConversationParticipantProfiles({
          id: conversation.id,
          participantProfiles,
        }),
      )
      return buildContactOpenResult(
        getState().communications.conversations.find((c) => c.id === conversation.id),
        relatedType,
        relatedId,
        contextAlreadyLinked,
      )
    }

    const created = dispatch(
      createConversation({
        title: peerTitle,
        participantIds,
        participantProfiles,
        createdBy,
        senderName,
        relatedType,
        relatedId,
        relatedPath,
        relatedSnapshot,
      }),
    ).payload

    const canonicalId = (await persistConversationRemote(created)) || created.id
    if (canonicalId !== created.id) {
      const { data: canonicalRow, error: canonicalError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', canonicalId)
        .maybeSingle()
      if (canonicalError) throw canonicalError
      if (canonicalRow) {
        dispatch(
          replaceConversationId({
            fromId: created.id,
            conversation: normalizeConversation({
              ...fromRow(canonicalRow),
              messages: created.messages || [],
              messagesLoaded: created.messagesLoaded ?? false,
            }),
          }),
        )
        dispatch(
          updateConversationContext({
            id: canonicalId,
            ...contextPatch,
            introducedBy: createdBy,
          }),
        )
        dispatch(
          mergeConversationParticipantProfiles({
            id: canonicalId,
            participantProfiles,
          }),
        )
        return buildContactOpenResult(
          getState().communications.conversations.find((c) => c.id === canonicalId),
          relatedType,
          relatedId,
          false,
        )
      }
    }

    return buildContactOpenResult(created, relatedType, relatedId, false)
  },
)

export const refreshConversations = createAsyncThunk(
  'communications/refreshConversations',
  async (_, { getState, dispatch }) => {
    const uid = getState().auth.user?.id
    if (!uid || !supabase) return 0

    const { data, error } = await fetchUserConversations(supabase, uid, { limit: 100 })
    if (error) throw error

    const conversations = mergeConversations(
      getState().communications.conversations,
      fromRows(data || []).map((conv) =>
        normalizeConversation({ ...conv, messages: [], messagesLoaded: false }),
      ),
    )
    dispatch(setAll({ conversations }))
    return conversations.length
  },
)

export const ensureConversationFromRemote = createAsyncThunk(
  'communications/ensureConversationFromRemote',
  async (conversationId, { dispatch, getState }) => {
    const existing = getState().communications.conversations.find((c) => c.id === conversationId)
    if (existing) return existing

    const { data, error } = await supabase.from('conversations').select('*').eq('id', conversationId).maybeSingle()
    if (error) throw error
    if (!data) return null

    const conversation = normalizeConversation({
      ...fromRow(data),
      messages: [],
      messagesLoaded: false,
    })
    dispatch(receiveRemoteConversation(conversation))
    return conversation
  },
)

export const {
  addNotification,
  archiveNotification,
  archiveConversation,
  createConversation,
  createSupportTicket,
  deleteMessageLocally,
  markAllNotificationsRead,
  markConversationRead,
  markNotificationRead,
  reactToMessage,
  replySupportTicket,
  restoreConversation,
  saveConversationDraft,
  sendMessage,
  toggleConversationBlock,
  toggleConversationMute,
  toggleConversationPin,
  replaceConversationId,
  updateConversationContext,
  mergeConversationParticipantProfiles,
  updateSupportStatus,
  setAll,
  receiveRemoteMessage,
  receiveRemoteConversation,
  syncRemoteConversation,
  receiveRemoteNotification,
  setConversationMessages,
} = communicationSlice.actions
export default communicationSlice.reducer
