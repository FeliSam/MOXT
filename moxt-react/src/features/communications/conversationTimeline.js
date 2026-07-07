export function normalizeRelatedContextEntry(entry) {
  if (!entry) return null
  return {
    id: entry.id,
    relatedType: entry.relatedType || entry.related_type,
    relatedId: entry.relatedId || entry.related_id,
    relatedPath: entry.relatedPath || entry.related_path,
    relatedSnapshot: entry.relatedSnapshot || entry.related_snapshot,
    introducedAt: entry.introducedAt || entry.introduced_at,
    introducedBy: entry.introducedBy || entry.introduced_by || null,
  }
}

export function normalizeRelatedContexts(conversation) {
  const parsed = Array.isArray(conversation?.relatedContexts)
    ? conversation.relatedContexts.map(normalizeRelatedContextEntry).filter(Boolean)
    : []
  if (parsed.length) return parsed

  const snapshot = conversation?.relatedSnapshot
  const relatedId = conversation?.relatedId
  if (!snapshot && !relatedId) return []

  return [
    {
      id: `CTX-legacy-${relatedId || 'unknown'}`,
      relatedType: conversation.relatedType,
      relatedId,
      relatedPath: conversation.relatedPath,
      relatedSnapshot: snapshot,
      introducedAt: conversation.createdAt || conversation.updatedAt || new Date().toISOString(),
      introducedBy: conversation.createdBy || null,
    },
  ]
}

export function relatedContextKey(relatedType, relatedId) {
  return `${relatedType || 'general'}:${relatedId || ''}`
}

export function appendRelatedContext(
  conversation,
  { relatedType, relatedId, relatedPath, relatedSnapshot, introducedBy, introducedAt },
) {
  if (!relatedSnapshot || !relatedId) return conversation

  const contexts = [...normalizeRelatedContexts(conversation)]
  const key = relatedContextKey(relatedType, relatedId)
  if (contexts.some((entry) => relatedContextKey(entry.relatedType, entry.relatedId) === key)) {
    return { ...conversation, relatedContexts: contexts }
  }

  return {
    ...conversation,
    relatedContexts: [
      ...contexts,
      {
        id: `CTX-${Date.now().toString(36).toUpperCase()}-${relatedId}`,
        relatedType,
        relatedId,
        relatedPath,
        relatedSnapshot,
        introducedAt: introducedAt || new Date().toISOString(),
        introducedBy: introducedBy || null,
      },
    ],
  }
}

export function buildConversationTimeline(conversation, userId) {
  const relatedItems = normalizeRelatedContexts(conversation).map((entry) => ({
    kind: 'related',
    id: entry.id,
    at: new Date(entry.introducedAt),
    preview: entry.relatedSnapshot,
  }))

  const messageItems = (conversation.messages || [])
    .filter((message) => !message.deletedBy?.includes(userId))
    .map((message) => ({
      kind: 'message',
      id: message.id,
      at: new Date(message.createdAt),
      message,
    }))

  return [...relatedItems, ...messageItems].sort((left, right) => left.at - right.at)
}
