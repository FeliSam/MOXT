import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { supabase } from '../../services/supabaseClient'
import { fromRow, fromRows } from '../../services/remoteRowMapper'
import { createLocalStorage } from '../../services/createLocalStorage'

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
    attachment: parseJsonValue(message.attachment, null),
    reactions: parseJsonValue(message.reactions, {}),
    deletedBy: parseIdList(message.deletedBy),
    deliveredTo: parseIdList(message.deliveredTo),
    readBy: parseIdList(message.readBy),
  }
}

export function normalizeConversation(conv) {
  if (!conv) return conv
  return {
    ...conv,
    participantIds: parseIdList(conv.participantIds),
    unreadBy: parseRecord(conv.unreadBy),
    archivedBy: parseIdList(conv.archivedBy),
    pinnedBy: parseIdList(conv.pinnedBy),
    mutedBy: parseIdList(conv.mutedBy),
    blockedBy: parseIdList(conv.blockedBy),
    messages: Array.isArray(conv.messages) ? conv.messages : [],
    messagesLoaded: conv.messagesLoaded ?? false,
    messageCount: Math.max(
      Number(conv.messageCount) || 0,
      Array.isArray(conv.messages) ? conv.messages.length : 0,
    ),
  }
}

export function mergeConversations(localConversations, remoteConversations) {
  const byId = new Map(
    remoteConversations.map((conv) => [conv.id, normalizeConversation(conv)]),
  )

  for (const localConv of localConversations.map(normalizeConversation)) {
    const remoteConv = byId.get(localConv.id)
    if (remoteConv) {
      byId.set(localConv.id, {
        ...remoteConv,
        messages: localConv.messagesLoaded ? localConv.messages : [],
        messagesLoaded: localConv.messagesLoaded ?? false,
        drafts: localConv.drafts ?? remoteConv.drafts,
        unreadBy: { ...remoteConv.unreadBy, ...localConv.unreadBy },
        archivedBy: localConv.archivedBy?.length ? localConv.archivedBy : remoteConv.archivedBy,
        pinnedBy: localConv.pinnedBy?.length ? localConv.pinnedBy : remoteConv.pinnedBy,
        mutedBy: localConv.mutedBy?.length ? localConv.mutedBy : remoteConv.mutedBy,
        blockedBy: localConv.blockedBy?.length ? localConv.blockedBy : remoteConv.blockedBy,
      })
    } else {
      byId.set(localConv.id, localConv)
    }
  }

  return [...byId.values()].sort(
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
      const exists = state.conversations.some((c) => c.id === conversation.id)
      if (!exists) state.conversations.unshift(conversation)
    },
    syncRemoteConversation(state, action) {
      const incoming = normalizeConversation(action.payload)
      const index = state.conversations.findIndex((item) => item.id === incoming.id)
      if (index < 0) {
        state.conversations.unshift(incoming)
        return
      }
      const existing = normalizeConversation(state.conversations[index])
      state.conversations[index] = {
        ...existing,
        ...incoming,
        messages: existing.messages,
        messagesLoaded: existing.messagesLoaded,
        messageCount: Math.max(
          existing.messageCount || 0,
          incoming.messageCount || existing.messages.length,
        ),
      }
      bumpConversationToTop(state, incoming.id)
    },
    createConversation: {
      reducer(state, action) {
        const payload = normalizeConversation(action.payload)
        if (new Set(payload.participantIds).size < 2) return
        const existing = state.conversations.find(
          (item) => {
            const normalized = normalizeConversation(item)
            return (
              normalized.relatedType === payload.relatedType &&
              normalized.relatedId === payload.relatedId &&
              payload.participantIds.every((id) => normalized.participantIds.includes(id))
            )
          },
        )
        if (!existing) state.conversations.unshift(payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        return {
          payload: {
            id: `CONV-${Date.now().toString(36).toUpperCase()}`,
            title: values.title,
            relatedType: values.relatedType || 'general',
            relatedId: values.relatedId || null,
            relatedPath: values.relatedPath || null,
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
          },
        }
      },
    },
    sendMessage: {
      reducer(state, action) {
        const conversation = state.conversations.find(
          (item) => item.id === action.payload.conversationId,
        )
        if (!conversation) return
        const participantIds = parseIdList(conversation.participantIds)
        if (!participantIds.includes(action.payload.senderId)) return
        conversation.participantIds = participantIds
        conversation.messages.push(action.payload.message)
        conversation.messagesLoaded = true
        conversation.messageCount = conversation.messages.length
        conversation.updatedAt = action.payload.message.createdAt
        conversation.participantIds
          .filter((participantId) => participantId !== action.payload.senderId)
          .forEach((participantId) => {
            conversation.unreadBy ||= {}
            conversation.unreadBy[participantId] = (conversation.unreadBy[participantId] || 0) + 1
          })
        bumpConversationToTop(state, action.payload.conversationId)
      },
      prepare({ attachment, conversationId, replyToId, senderId, senderName, text }) {
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
        if (message.senderId !== action.payload.userId) {
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
      const conversation = state.conversations.find((c) => c.id === action.payload.conversationId)
      if (!conversation) return
      const remoteMessages = (action.payload.messages || []).map(normalizeMessage)
      const remoteIds = new Set(remoteMessages.map((message) => message.id))
      const localOnly = conversation.messages.filter((message) => !remoteIds.has(message.id))
      conversation.messages = [...remoteMessages, ...localOnly].sort(
        (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
      )
      conversation.messageCount = conversation.messages.length
      conversation.messagesLoaded = true
    },
  },
})

export const loadConversationMessages = createAsyncThunk(
  'communications/loadConversationMessages',
  async (conversationId, { dispatch, getState }) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200)
    if (error) throw error
    dispatch(
      setConversationMessages({
        conversationId,
        messages: fromRows(data || []).map(normalizeMessage),
      }),
    )
    return { conversationId, count: (data || []).length }
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
  updateSupportStatus,
  setAll,
  receiveRemoteMessage,
  receiveRemoteConversation,
  syncRemoteConversation,
  receiveRemoteNotification,
  setConversationMessages,
} = communicationSlice.actions
export default communicationSlice.reducer
