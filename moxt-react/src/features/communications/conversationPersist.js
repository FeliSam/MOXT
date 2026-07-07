import { supabase } from '../../services/supabaseClient'
import { conversationToRemoteRow, messageToRemoteRow } from './messagingRemote'
import { participantKey } from './conversationUtils'

/** Résout l'id canonique et tous les ids liés (doublons participant_key) pour charger les messages. */
export async function resolveMessageLoadScope(conversationId, conversation) {
  const conversationIds = new Set([conversationId])
  let canonicalId = conversationId
  let participantKeyValue = conversation ? participantKey(conversation.participantIds) : null
  let remoteRow = null

  if (!supabase) {
    return { canonicalId, conversationIds: [...conversationIds], remoteRow }
  }

  const { data: row, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error

  if (row) {
    remoteRow = row
    conversationIds.add(row.id)
    canonicalId = row.id
    participantKeyValue ||= row.participant_key
  }

  if (participantKeyValue) {
    const { data: siblings, error: siblingsError } = await supabase
      .from('conversations')
      .select('id, updated_at')
      .eq('participant_key', participantKeyValue)
      .order('updated_at', { ascending: false })
    if (siblingsError) throw siblingsError
    for (const sibling of siblings || []) {
      conversationIds.add(sibling.id)
    }
    if (siblings?.[0]?.id) {
      canonicalId = siblings[0].id
    }
  }

  return {
    canonicalId,
    conversationIds: [...conversationIds],
    remoteRow,
  }
}

/** Enregistre une conversation sans doublon participant_key (réutilise l'id existant). */
export async function persistConversationRemote(conversation) {
  if (!supabase) return conversation?.id ?? null

  const row = conversationToRemoteRow(conversation)
  const key = row.participant_key
  if (!key) throw new Error('participant_key manquant')

  const { data: existing, error: lookupError } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_key', key)
    .maybeSingle()
  if (lookupError) throw lookupError

  const targetId = existing?.id ?? row.id
  const payload = { ...row, id: targetId }

  const { error } = await supabase
    .from('conversations')
    .upsert(payload, { onConflict: 'id' })
  if (error) {
    if (error.code === '23505') {
      const { data: retry, error: retryError } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_key', key)
        .maybeSingle()
      if (retryError) throw retryError
      if (retry?.id) {
        const { id: _id, ...fields } = row
        const { error: updateError } = await supabase
          .from('conversations')
          .update(fields)
          .eq('id', retry.id)
        if (updateError) throw updateError
        return retry.id
      }
    }
    throw error
  }

  return targetId
}

/** Enregistre un message — la conversation doit déjà exister en base. */
export async function persistMessageRemote(message, conversationId) {
  if (!supabase) return conversationId

  const { data: conversationRow, error: lookupError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (!conversationRow) {
    throw new Error(
      `Conversation introuvable (${conversationId}). Réouvrez la discussion avant d'envoyer.`,
    )
  }

  const row = messageToRemoteRow(message, conversationId)
  const { error } = await supabase.from('messages').upsert(row, { onConflict: 'id' })
  if (error) throw error
  return conversationId
}

/** Résout l'id canonique Supabase pour une conversation locale. */
export async function resolveCanonicalConversationId(conversation, onReconciled) {
  const canonicalId = await persistConversationRemote(conversation)
  if (!canonicalId) {
    throw new Error('Impossible de synchroniser la conversation.')
  }
  if (canonicalId !== conversation.id && onReconciled) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', canonicalId)
      .maybeSingle()
    if (error) throw error
    if (data) {
      onReconciled({ fromId: conversation.id, remoteRow: data })
    }
  }
  return canonicalId
}

/**
 * Persiste la conversation puis le message avec le même id canonique
 * (évite la violation FK messages.conversation_id).
 */
export async function persistMessageForConversation(message, conversation, onReconciled) {
  const canonicalId = await resolveCanonicalConversationId(conversation, onReconciled)
  await persistMessageRemote(message, canonicalId)
  return canonicalId
}
