import { supabase } from '../../services/supabaseClient'
import { conversationToRemoteRow, messageToRemoteRow } from './messagingRemote'

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

/** Enregistre un message sans doublon (upsert par id). */
export async function persistMessageRemote(message, conversationId) {
  if (!supabase) return
  const { error } = await supabase
    .from('messages')
    .upsert(messageToRemoteRow(message, conversationId), { onConflict: 'id' })
  if (error) throw error
}
