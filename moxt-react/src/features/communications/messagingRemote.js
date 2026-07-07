import { normalizeConversation } from './communicationSlice'
import { participantKey } from './conversationUtils'

const CONVERSATION_REMOTE_FIELDS = [
  'id',
  'title',
  'relatedType',
  'relatedId',
  'relatedPath',
  'relatedSnapshot',
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
  return row
}

export function messageToRemoteRow(message, conversationId) {
  return {
    id: message.id,
    conversation_id: conversationId,
    sender_id: message.senderId,
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
