import { createAsyncThunk } from '@reduxjs/toolkit'
import { getAdminUserIds } from '@moxt/shared/utils/notificationUtils.js'
import { supabase } from '../../services/supabaseClient'
import {
  createSupportTicket,
  openConversationWithContact,
  sendMessage,
} from './communicationSlice'
import { messagesText } from './messagesI18n'

async function resolveSupportAdminId(state, excludeUserId) {
  const localIds = getAdminUserIds(state).filter((id) => id && id !== excludeUserId)
  if (localIds.length) {
    const users = state.administration?.users || []
    const ranked = [...localIds].sort((a, b) => {
      const roleA = users.find((user) => user.id === a)?.role
      const roleB = users.find((user) => user.id === b)?.role
      if (roleA === 'superadmin' && roleB !== 'superadmin') return -1
      if (roleB === 'superadmin' && roleA !== 'superadmin') return 1
      return 0
    })
    return ranked[0]
  }

  if (!supabase) return null
  const { data, error } = await supabase.rpc('moxt_pick_support_admin')
  if (error) {
    console.warn('[MOXT] moxt_pick_support_admin:', error.message)
    return null
  }
  return data || null
}

function findOpenSupportConversation(conversations, userId) {
  return (conversations || []).find((item) => {
    if (item.relatedType !== 'support') return false
    const participants = item.participantIds || []
    return participants.map(String).includes(String(userId))
  })
}

export const openAdminSupportChat = createAsyncThunk(
  'communications/openAdminSupportChat',
  async ({ message, subject }, { dispatch, getState, rejectWithValue }) => {
    const state = getState()
    const user = state.auth.user
    if (!user?.id) {
      return rejectWithValue('not_authenticated')
    }

    const text = String(message || '').trim()
    if (!text) {
      return rejectWithValue('empty_message')
    }

    const existing = findOpenSupportConversation(state.communications.conversations, user.id)
    const adminId =
      (existing &&
        (existing.participantIds || []).map(String).find((id) => id !== String(user.id))) ||
      (await resolveSupportAdminId(state, user.id))

    if (!adminId) {
      return rejectWithValue('no_admin')
    }

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Membre'
    const ticketSubject =
      String(subject || '').trim() || messagesText(null, 'messages.assistant.adminTicketSubject')
    const relatedId = `support-${user.id}`

    let ticketId = null
    try {
      const ticketAction = dispatch(
        createSupportTicket({
          userId: user.id,
          userName,
          subject: ticketSubject,
          priority: 'normal',
          category: 'assistant',
          message: text,
        }),
      )
      ticketId = ticketAction.payload?.id || null
    } catch (error) {
      console.warn('[MOXT] Ticket support optionnel:', error?.message || error)
    }

    const adminUser = (state.administration?.users || []).find((entry) => entry.id === adminId)
    const result = await dispatch(
      openConversationWithContact({
        ownerId: adminId,
        relatedType: 'support',
        relatedId,
        relatedPath: `/messages?relatedType=support&relatedId=${encodeURIComponent(relatedId)}`,
        relatedSnapshot: {
          type: 'support',
          title: messagesText(null, 'communications.related.support'),
          subtitle: ticketSubject,
          ticketId,
          path: '/messages',
        },
        createdBy: user.id,
        senderName: userName,
        contactProfile: adminUser
          ? {
              firstName: adminUser.firstName || 'Admin',
              lastName: adminUser.lastName || 'MOXT',
              avatarUrl: adminUser.avatarUrl || null,
            }
          : {
              firstName: 'Support',
              lastName: 'MOXT',
            },
        initialMessage: text,
      }),
    ).unwrap()

    const conversationId = result?.conversation?.id
    if (conversationId && result.contextAlreadyLinked) {
      dispatch(
        sendMessage({
          conversationId,
          senderId: user.id,
          senderName: userName,
          text,
        }),
      )
    }

    return {
      conversationId,
      ticketId,
      adminId,
      reused: Boolean(existing) || Boolean(result?.contextAlreadyLinked),
    }
  },
)
