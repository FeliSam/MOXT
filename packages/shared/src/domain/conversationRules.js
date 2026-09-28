/**
 * Règles messagerie partagées web + mobile (source unique).
 * Le web réexporte ces fonctions depuis features/communications/conversationDisplay.js
 * et pages/messages/messageUtils.js.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value) {
  return UUID_RE.test(String(value || '').trim())
}

export function formatProfileName(profile) {
  if (!profile) return ''
  const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
  return name || profile.name || ''
}

export function isParticipantDisplayName(conversation, title) {
  const normalized = String(title || '').trim().toLowerCase()
  if (!normalized || !conversation) return false
  const profiles = conversation.participantProfiles || {}
  return Object.values(profiles).some((profile) => {
    const name = formatProfileName(profile)
    return Boolean(name) && name.trim().toLowerCase() === normalized
  })
}

export function getOtherParticipantId(conversation, currentUserId) {
  const ids = conversation?.participantIds || []
  return ids.find((id) => id && id !== currentUserId) || ids[0] || null
}

export function isProfileVerifiedLike(profile) {
  if (!profile) return false
  return profile.verified === true || profile.status === 'verified'
}

/** Interlocuteur affiché (nom, avatar) — même résolution que le web (getConversationPeer). */
export function resolveConversationPeer(conversation, currentUserId, fallbackName = 'Utilisateur') {
  const otherId = getOtherParticipantId(conversation, currentUserId)
  const profile = otherId ? conversation?.participantProfiles?.[otherId] : null
  const name = formatProfileName(profile) || conversation?.title || fallbackName
  return {
    id: otherId,
    name,
    avatarUrl: profile?.avatarUrl || null,
    verified: isProfileVerifiedLike(profile),
    lastActiveAt: profile?.lastActiveAt || null,
  }
}

export function profileFromRemoteRow(row) {
  if (!row?.id) return null
  return {
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    avatarUrl: row.avatar_url || null,
    status: row.status || '',
    verified: row.status === 'verified',
    lastActiveAt: row.last_active_at || null,
  }
}

/** Profils publics des participants (table `profiles`), indexés par id. */
export async function fetchParticipantProfiles(client, participantIds) {
  const unique = [
    ...new Set((participantIds || []).map((id) => String(id || '').trim()).filter(isUuid)),
  ]
  if (!unique.length || !client) return {}

  const { data, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, status, last_active_at')
    .in('id', unique)
  if (error) throw error

  return Object.fromEntries(
    (data || []).map((row) => [row.id, profileFromRemoteRow(row)]).filter(([, profile]) => profile),
  )
}

export function buildParticipantProfilesMap({
  participantIds,
  remoteProfiles = {},
  currentUser,
  ownerId,
  contactProfile,
}) {
  const profiles = {}
  for (const participantId of participantIds) {
    if (remoteProfiles[participantId]) {
      profiles[participantId] = remoteProfiles[participantId]
      continue
    }
    if (currentUser?.id === participantId) {
      profiles[participantId] = {
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        avatarUrl: currentUser.avatarUrl || null,
        verified: Boolean(currentUser.verified),
        status: currentUser.verified ? 'verified' : '',
      }
      continue
    }
    if (participantId === ownerId && contactProfile) {
      profiles[participantId] = contactProfile
    }
  }
  return profiles
}

export function mergeParticipantProfiles(existing = {}, incoming = {}) {
  const merged = { ...existing }
  for (const [userId, profile] of Object.entries(incoming)) {
    if (!profile) continue
    merged[userId] = { ...merged[userId], ...profile }
  }
  return merged
}

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

/**
 * Normalise une ligne `conversations` (RPC list_my_conversations ou table) en objet camelCase,
 * mêmes champs que normalizeConversation du web (sans l’état de chargement des messages).
 */
export function conversationFromRemoteRow(row) {
  if (!row) return null
  const pick = (camel, snake) => row[camel] ?? row[snake]
  const messages = Array.isArray(row.messages) ? row.messages : []
  return {
    id: row.id,
    title: row.title || '',
    status: row.status || null,
    relatedType: pick('relatedType', 'related_type') || null,
    relatedId: pick('relatedId', 'related_id') || null,
    relatedPath: pick('relatedPath', 'related_path') || null,
    createdBy: pick('createdBy', 'created_by') || null,
    createdAt: pick('createdAt', 'created_at') || null,
    updatedAt: pick('updatedAt', 'updated_at') || null,
    participantIds: parseIdList(pick('participantIds', 'participant_ids')).map(String),
    participantProfiles: parseRecord(pick('participantProfiles', 'participant_profiles')),
    unreadBy: parseRecord(pick('unreadBy', 'unread_by')),
    archivedBy: parseIdList(pick('archivedBy', 'archived_by')).map(String),
    pinnedBy: parseIdList(pick('pinnedBy', 'pinned_by')).map(String),
    mutedBy: parseIdList(pick('mutedBy', 'muted_by')).map(String),
    blockedBy: parseIdList(pick('blockedBy', 'blocked_by')).map(String),
    messages,
    messageCount: Math.max(Number(pick('messageCount', 'message_count')) || 0, messages.length),
    lastMessageText: pick('lastMessageText', 'last_message_text') ?? '',
    lastMessageSenderId: String(pick('lastMessageSenderId', 'last_message_sender_id') ?? ''),
    lastMessageAt: pick('lastMessageAt', 'last_message_at') ?? null,
  }
}

export function conversationMessageCount(conversation, userId) {
  const visible = (conversation.messages || []).filter(
    (message) => !message.deletedBy?.includes(userId),
  )
  return Math.max(visible.length, conversation.messageCount || 0)
}

/** Conversation ouverte via Contacter sans aucun message envoyé. */
export function isEmptyConversation(conversation, userId) {
  if (!conversation) return true
  if (conversationMessageCount(conversation, userId) > 0) return false
  if (conversation.lastMessageAt || conversation.last_message_at) return false
  if (String(conversation.lastMessageText || conversation.last_message_text || '').trim()) {
    return false
  }
  return true
}

/**
 * Masque les chats sans message (clic Contacter sans envoi),
 * sauf la conversation active encore ouverte.
 */
export function shouldShowConversationInList(conversation, userId, activeId = null) {
  if (!conversation) return false
  if (activeId && conversation.id === activeId) return true
  return !isEmptyConversation(conversation, userId)
}

export function countUnreadMessages(conversations, userId) {
  return conversations.reduce((total, item) => total + (item.unreadBy?.[userId] || 0), 0)
}

export function isMessageFromUser(message, userId) {
  if (!message || !userId) return false
  return String(message.senderId ?? message.sender_id) === String(userId)
}

function conversationActivityTime(conversation) {
  return new Date(conversation.lastMessageAt || conversation.updatedAt || 0).getTime() || 0
}

/**
 * Liste de la messagerie comme la page web : participant, non archivée (ou archivée si demandé),
 * non vide, épinglées d’abord puis activité la plus récente. Pas de dédoublonnage.
 */
export function selectInboxConversations(conversations = [], userId, { showArchived = false, activeId = null } = {}) {
  return conversations
    .filter((item) => (item.participantIds || []).includes(userId))
    .filter((item) => Boolean(item.archivedBy?.includes(userId)) === showArchived)
    .filter((item) => shouldShowConversationInList(item, userId, activeId))
    .sort((left, right) => {
      const leftPinned = left.pinnedBy?.includes(userId) ? 1 : 0
      const rightPinned = right.pinnedBy?.includes(userId) ? 1 : 0
      if (leftPinned !== rightPinned) return rightPinned - leftPinned
      return conversationActivityTime(right) - conversationActivityTime(left)
    })
}
