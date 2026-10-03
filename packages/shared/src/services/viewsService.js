/**
 * Compteur de vues atomique (RPC moxt_increment_view), même appel que
 * videos/incrementVideoView et marketplace/incrementListingView du web.
 * Le serveur ignore la vue de l'auteur et n'incrémente qu'un contenu actif.
 */

export async function incrementEntityView(client, entityType, entityId) {
  if (!client || !entityType || !entityId) return null
  const { data, error } = await client.rpc('moxt_increment_view', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  })
  if (error) return null
  const parsed = Number(data)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}
