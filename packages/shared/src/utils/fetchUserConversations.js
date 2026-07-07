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
    .select('*')
    .filter('participant_ids', 'cs', participantFilter)
    .order('updated_at', { ascending: false })
    .limit(safeLimit)

  return { data: queryResult.data ?? [], error: queryResult.error }
}
