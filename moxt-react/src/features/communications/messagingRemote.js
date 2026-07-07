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
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  senderId: 'sender_id',
  senderName: 'sender_name',
  replyToId: 'reply_to_id',
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

export function conversationToRemoteRow(conversation) {
  const normalized = normalizeConversation(conversation)
  const row = {}
  for (const field of CONVERSATION_REMOTE_FIELDS) {
    if (normalized[field] === undefined) continue
    const remoteKey = FIELD_MAP[field] ?? field
    row[remoteKey] = normalized[field]
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
    reactions: jsonOrNull(message.reactions ?? {}),
    deleted_by: jsonOrNull(message.deletedBy ?? []),
    delivered_to: jsonOrNull(message.deliveredTo ?? []),
    read_by: jsonOrNull(message.readBy ?? []),
    created_at: message.createdAt,
  }
}
