/**
 * Charge les conversations de l'utilisateur connecté.
 * Préfère la RPC SQL (évite les erreurs PostgREST « invalid input syntax for type json »).
 */
export async function fetchUserConversations(client, userId, { limit = 100 } = {}) {
  if (!client || !userId) {
    return { data: [], error: null }
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200))

  const rpcResult = await client.rpc('list_my_conversations', { p_limit: safeLimit })
  if (!rpcResult.error) {
    return { data: rpcResult.data ?? [], error: null }
  }

  const participantFilter = JSON.stringify([String(userId)])
  const queryResult = await client
    .from('conversations')
    .select(
      'id, title, related_type, related_id, related_path, related_snapshot, related_contexts, participant_profiles, participant_ids, participant_key, created_by, status, unread_by, archived_by, pinned_by, muted_by, blocked_by, message_count, last_message_text, last_message_sender_id, last_message_at, created_at, updated_at',
    )
    .filter('participant_ids', 'cs', participantFilter)
    .order('updated_at', { ascending: false })
    .limit(safeLimit)

  return { data: queryResult.data ?? [], error: queryResult.error }
}
