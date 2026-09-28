import { fetchUserConversations } from '../utils/fetchUserConversations.js'
import {
  conversationFromRemoteRow,
  countUnreadMessages,
  fetchParticipantProfiles,
  mergeParticipantProfiles,
  resolveConversationPeer,
  selectInboxConversations,
} from '../domain/conversationRules.js'

export const INBOX_LIMIT = 80

/**
 * Conversations du compte (RPC list_my_conversations puis repli), profils des participants
 * complétés depuis `profiles` comme la page Messages web.
 */
export async function fetchInbox(client, userId, { limit = INBOX_LIMIT, withProfiles = true } = {}) {
  if (!client || !userId) return { conversations: [], error: null }
  const { data, error } = await fetchUserConversations(client, userId, { limit })
  let conversations = (data || []).map(conversationFromRemoteRow).filter(Boolean)
  if (withProfiles && conversations.length) {
    const ids = conversations.flatMap((item) => item.participantIds || [])
    try {
      const profiles = await fetchParticipantProfiles(client, ids)
      conversations = conversations.map((item) => ({
        ...item,
        participantProfiles: mergeParticipantProfiles(item.participantProfiles, profiles),
      }))
    } catch {
      // profils optionnels : on garde participant_profiles de la conversation
    }
  }
  return { conversations, error: error || null }
}

/** Lignes prêtes à afficher (interlocuteur, aperçu, non lus) dans l’ordre du web. */
export function buildInboxRows(conversations, userId, { fallbackName = 'Utilisateur', showArchived = false } = {}) {
  return selectInboxConversations(conversations, userId, { showArchived }).map((conversation) => ({
    conversation,
    peer: resolveConversationPeer(conversation, userId, fallbackName),
    unread: conversation.unreadBy?.[userId] || 0,
    pinned: Boolean(conversation.pinnedBy?.includes(userId)),
    lastMessageText: conversation.lastMessageText || '',
    lastActivityAt: conversation.lastMessageAt || conversation.updatedAt || null,
  }))
}

export { countUnreadMessages }

/** Même écriture que le web (supabaseMiddleware) : RPC moxt_mark_conversation_read. */
export async function markConversationRead(client, conversationId) {
  if (!client || !conversationId) return { error: null }
  const { error } = await client.rpc('moxt_mark_conversation_read', { p_conversation_id: conversationId })
  return { error: error || null }
}
