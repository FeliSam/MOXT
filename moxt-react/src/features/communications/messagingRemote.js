import { normalizeConversation } from './communicationSlice'
import { participantKey } from './conversationUtils'

const CONVERSATION_REMOTE_FIELDS = [
  'id',
  'title',
  'relatedType',
  'relatedId',
  'relatedPath',
  'relatedSnapshot',
  'relatedContexts',
  'participantProfiles',
  'participantIds',
  'createdBy',
  'status',
  'unreadBy',
  'archivedBy',
  'pinnedBy',
  'mutedBy',
  'blockedBy',
  'messageCount',
  'lastMessageText',
  'lastMessageSenderId',
  'lastMessageAt',
  'createdAt',
  'updatedAt',
]

const FIELD_MAP = {
  createdBy: 'created_by',
  relatedId: 'related_id',
  relatedType: 'related_type',
  relatedPath: 'related_path',
  relatedSnapshot: 'related_snapshot',
  relatedContexts: 'related_contexts',
  participantProfiles: 'participant_profiles',
  participantIds: 'participant_ids',
  unreadBy: 'unread_by',
  archivedBy: 'archived_by',
  pinnedBy: 'pinned_by',
  mutedBy: 'muted_by',
  blockedBy: 'blocked_by',
  messageCount: 'message_count',
  lastMessageText: 'last_message_text',
  lastMessageSenderId: 'last_message_sender_id',
  lastMessageAt: 'last_message_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  senderId: 'sender_id',
  senderName: 'sender_name',
  replyToId: 'reply_to_id',
  relatedContextId: 'related_context_id',
  deletedBy: 'deleted_by',
  deliveredTo: 'delivered_to',
  readBy: 'read_by',
}

function jsonOrNull(value) {
  if (value === undefined || value === null) return null
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
}

function jsonbValue(value, fallback) {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value
}

export function conversationToRemoteRow(conversation) {
  const normalized = normalizeConversation(conversation)
  const row = {}
  for (const field of CONVERSATION_REMOTE_FIELDS) {
    if (normalized[field] === undefined) continue
    const remoteKey = FIELD_MAP[field] ?? field
    if (remoteKey === 'participant_ids') {
      row[remoteKey] = jsonbValue(normalized.participantIds, [])
    } else if (['archived_by', 'pinned_by', 'muted_by', 'blocked_by'].includes(remoteKey)) {
      row[remoteKey] = jsonbValue(normalized[field], [])
    } else if (['unread_by', 'participant_profiles', 'related_snapshot', 'related_contexts'].includes(remoteKey)) {
      row[remoteKey] = jsonbValue(normalized[field], remoteKey === 'unread_by' || remoteKey === 'participant_profiles' ? {} : null)
    } else {
      row[remoteKey] = normalized[field]
    }
  }
  row.participant_key = participantKey(normalized.participantIds)
  row.message_count = normalized.messageCount ?? normalized.messages?.length ?? 0
  if (normalized.relatedSnapshot) {
    row.related_snapshot = normalized.relatedSnapshot
  }
  if (!isUuid(normalized.createdBy)) {
    delete row.created_by
  }
  return row
}

export function messageToRemoteRow(message, conversationId) {
  const senderId = isUuid(message.senderId) ? message.senderId : null
  if (!senderId) {
    throw new Error('Expéditeur du message invalide.')
  }
  return {
    id: message.id,
    conversation_id: conversationId,
    sender_id: senderId,
    sender_name: message.senderName,
    text: message.text,
    attachment: jsonOrNull(message.attachment),
    reply_to_id: message.replyToId || null,
    related_context_id: message.relatedContextId || null,
    reactions: jsonOrNull(message.reactions ?? {}),
    deleted_by: jsonOrNull(message.deletedBy ?? []),
    delivered_to: jsonOrNull(message.deliveredTo ?? []),
    read_by: jsonOrNull(message.readBy ?? []),
    created_at: message.createdAt,
  }
}
