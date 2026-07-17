import { messagesText } from './messagesI18n'

const DEFAULT_PATH_BUILDERS = {
  listing: (id) => `/marketplace/${id}`,
  job: (id) => `/jobs/${id}`,
  parcel: (id) => `/parcels/${id}`,
  event: (id) => `/events/${id}`,
  business: (id) => `/businesses/${id}`,
  transfer: (id) => `/transfers/${id}`,
  p2p: (id) => `/p2p/${id}`,
}

function defaultRelatedPath(relatedType, relatedId) {
  if (!relatedId) return null
  return DEFAULT_PATH_BUILDERS[relatedType]?.(relatedId) || null
}

export function buildContextPreview(entry, conversation = {}, t) {
  const snapshot = entry?.relatedSnapshot
  const relatedType = entry?.relatedType || conversation?.relatedType
  const relatedId = entry?.relatedId || conversation?.relatedId
  const relatedPath = entry?.relatedPath || conversation?.relatedPath
  const path =
    snapshot?.path || relatedPath || defaultRelatedPath(relatedType, relatedId)

  if (!path) return null

  return {
    type: snapshot?.type || relatedType || 'general',
    id: snapshot?.id || relatedId,
    title:
      snapshot?.title ||
      conversation?.title ||
      messagesText(t, 'communications.snapshot.defaultTitle'),
    path,
    subtitle: snapshot?.subtitle ?? null,
    imageUrl: snapshot?.imageUrl ?? null,
    badge: snapshot?.badge ?? null,
    details: snapshot?.details ?? [],
  }
}

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
  const relatedPath = conversation?.relatedPath
  if (!snapshot && !relatedId && !relatedPath) return []

  return [
    {
      id: `CTX-legacy-${relatedId || 'unknown'}`,
      relatedType: conversation.relatedType,
      relatedId,
      relatedPath,
      relatedSnapshot: snapshot,
      introducedAt: conversation.createdAt || conversation.updatedAt || new Date().toISOString(),
      introducedBy: conversation.createdBy || null,
    },
  ]
}

export function relatedContextKey(relatedType, relatedId) {
  return `${relatedType || 'general'}:${relatedId || ''}`
}

export function findRelatedContext(conversation, relatedType, relatedId) {
  if (!relatedType || !relatedId) return null
  const key = relatedContextKey(relatedType, relatedId)
  return (
    normalizeRelatedContexts(conversation).find(
      (entry) => relatedContextKey(entry.relatedType, entry.relatedId) === key,
    ) || null
  )
}

export function findRelatedContextById(conversation, contextId) {
  if (!contextId) return null
  return normalizeRelatedContexts(conversation).find((entry) => entry.id === contextId) || null
}

export function hasRelatedContext(conversation, relatedType, relatedId) {
  return Boolean(findRelatedContext(conversation, relatedType, relatedId))
}

export function mergeRelatedContextArrays(remoteContexts = [], localContexts = []) {
  const normalize = (contexts) =>
    (Array.isArray(contexts) ? contexts : [])
      .map(normalizeRelatedContextEntry)
      .filter(Boolean)

  const merged = [...normalize(remoteContexts)]
  for (const entry of normalize(localContexts)) {
    const key = relatedContextKey(entry.relatedType, entry.relatedId)
    if (!merged.some((item) => relatedContextKey(item.relatedType, item.relatedId) === key)) {
      merged.push(entry)
    }
  }
  return merged
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
  const relatedItems = normalizeRelatedContexts(conversation)
    .map((entry) => {
      const preview = buildContextPreview(entry, conversation)
      if (!preview?.path) return null
      return {
        kind: 'related',
        id: entry.id,
        at: new Date(entry.introducedAt || conversation.createdAt || conversation.updatedAt),
        preview,
      }
    })
    .filter(Boolean)

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
