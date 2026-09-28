/**
 * « Contacter » : retrouve ou crée la conversation d'une paire de participants,
 * comme openConversationWithContact + persistConversationRemote.
 */

import { fetchParticipantProfiles, formatProfileName } from '../domain/conversationRules.js'

export function participantKey(participantIds) {
  return [...new Set((participantIds || []).map((id) => String(id || '').trim()).filter(Boolean))].sort().join(':')
}

function contextKey(type, id) {
  return `${type || 'general'}:${id || ''}`
}

function readContexts(row) {
  const raw = row?.related_contexts ?? row?.relatedContexts
  return Array.isArray(raw) ? raw : []
}

function hasContext(row, relatedType, relatedId) {
  if (!relatedType || !relatedId) return false
  const key = contextKey(relatedType, relatedId)
  return readContexts(row).some((entry) => contextKey(entry.relatedType || entry.related_type, entry.relatedId || entry.related_id) === key)
}

export function buildBusinessContactSnapshot(business) {
  if (!business?.id) return null
  return {
    type: 'business',
    id: business.id,
    title: business.name || '',
    path: `/businesses/${business.id}`,
    subtitle: business.category || business.primaryActivity || business.activity || null,
    imageUrl: business.logoUrl || business.imageUrl || null,
    badge: 'Entreprise',
    details: [business.city, business.country].filter(Boolean),
  }
}

function createConvId() {
  const suffix =
    globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return `CONV-${suffix.toUpperCase()}`
}

/**
 * Ouvre la discussion avec le propriétaire. Réutilise la ligne `participant_key`
 * s'il y en a une, et ajoute le contexte (entreprise, annonce…) s'il manque.
 */
export async function openContactConversation(client, input) {
  if (!client) throw new Error('Client Supabase indisponible')
  const { createdBy, ownerId, relatedType, relatedId, relatedPath, relatedSnapshot } = input
  if (!createdBy || !ownerId || createdBy === ownerId) {
    throw new Error('Interlocuteur invalide')
  }
  const participantIds = [createdBy, ownerId]
  const key = participantKey(participantIds)
  const remoteProfiles = await fetchParticipantProfiles(client, participantIds)
  const participantProfiles = { ...(input.participantProfiles || {}) }
  for (const id of participantIds) {
    if (remoteProfiles[id]) participantProfiles[id] = { ...participantProfiles[id], ...remoteProfiles[id] }
  }
  const title =
    input.title ||
    formatProfileName(participantProfiles[ownerId]) ||
    'Utilisateur'
  const now = new Date().toISOString()

  const { data: existing, error: lookupError } = await client
    .from('conversations')
    .select('*')
    .eq('participant_key', key)
    .maybeSingle()
  if (lookupError) throw lookupError

  const linked = existing ? hasContext(existing, relatedType, relatedId) : false
  const contexts = existing ? [...readContexts(existing)] : []
  if (relatedSnapshot && relatedId && !linked) {
    contexts.push({
      id: `CTX-${Date.now().toString(36).toUpperCase()}-${relatedId}`,
      relatedType,
      relatedId,
      relatedPath: relatedPath || relatedSnapshot.path || null,
      relatedSnapshot,
      introducedAt: now,
      introducedBy: createdBy,
    })
  }

  const row = {
    id: existing?.id || createConvId(),
    title: existing?.title || title,
    participant_ids: existing?.participant_ids || participantIds,
    participant_key: key,
    participant_profiles: { ...(existing?.participant_profiles || {}), ...participantProfiles },
    created_by: existing?.created_by || createdBy,
    status: existing?.status || 'active',
    unread_by: existing?.unread_by || {},
    related_type: relatedType || existing?.related_type || null,
    related_id: relatedId || existing?.related_id || null,
    related_path: relatedPath || relatedSnapshot?.path || existing?.related_path || null,
    related_snapshot: relatedSnapshot || existing?.related_snapshot || null,
    related_contexts: contexts,
    message_count: existing?.message_count || 0,
    created_at: existing?.created_at || now,
    updated_at: now,
  }

  const { error } = await client.from('conversations').upsert(row, { onConflict: 'id' })
  if (error) throw error

  const reply = linked
    ? contexts.find((entry) => contextKey(entry.relatedType || entry.related_type, entry.relatedId || entry.related_id) === contextKey(relatedType, relatedId))
    : null

  return {
    id: row.id,
    conversation: row,
    created: !existing,
    contextAlreadyLinked: linked,
    replyToContextId: reply?.id || null,
  }
}
