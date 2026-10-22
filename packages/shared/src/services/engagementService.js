/**
 * Écritures d'engagement (j'aime, commentaires, partages, abonnements), mêmes appels que
 * moxt-react/src/app/supabaseMiddleware.js : RPC atomiques côté serveur pour les compteurs,
 * table `publisher_subscriptions` pour les abonnements.
 */

export function createEngagementId(prefix) {
  const suffix =
    globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${suffix.toUpperCase()}`
}

/** Commentaire au format du web (videosSlice / postsSlice / marketplaceSlice : prepare). */
export function buildComment({ authorId, authorName, authorAvatarUrl, text }, now = new Date()) {
  return {
    id: createEngagementId('CMT'),
    authorId,
    authorName: authorName || '',
    authorAvatarUrl: authorAvatarUrl || '',
    text: String(text || '').trim(),
    createdAt: now.toISOString(),
  }
}

const LIKE_RPC = {
  video: ['moxt_video_toggle_like', 'p_video_id'],
  listing: ['moxt_listing_toggle_like', 'p_listing_id'],
  post: ['moxt_post_toggle_like', 'p_post_id'],
}

const ADD_COMMENT_RPC = {
  video: ['moxt_video_add_comment', 'p_video_id'],
  listing: ['moxt_listing_add_comment', 'p_listing_id'],
  post: ['moxt_post_add_comment', 'p_post_id'],
}

const DELETE_COMMENT_RPC = {
  video: ['moxt_video_delete_comment', 'p_video_id'],
  listing: ['moxt_listing_delete_comment', 'p_listing_id'],
  post: ['moxt_post_delete_comment', 'p_post_id'],
}

export const ENGAGEMENT_KINDS = Object.keys(LIKE_RPC)

async function callRpc(client, name, args) {
  if (!client) throw new Error('Client Supabase indisponible')
  const { data, error } = await client.rpc(name, args)
  if (error) throw error
  return data
}

function rpcFor(table, kind) {
  const entry = table[kind]
  if (!entry) throw new Error(`Type non pris en charge : ${kind}`)
  return entry
}

/** Bascule le j'aime de l'utilisateur connecté (le serveur lit auth.uid()). */
export async function toggleLike(client, kind, entityId) {
  const [name, key] = rpcFor(LIKE_RPC, kind)
  return callRpc(client, name, { [key]: entityId })
}

/** Ajoute un commentaire déjà construit (buildComment). */
export async function addComment(client, kind, entityId, comment) {
  const [name, key] = rpcFor(ADD_COMMENT_RPC, kind)
  return callRpc(client, name, { [key]: entityId, p_comment: comment })
}

/** Supprime un commentaire (auteur ou modération, contrôlé côté serveur). */
export async function deleteComment(client, kind, entityId, commentId) {
  const [name, key] = rpcFor(DELETE_COMMENT_RPC, kind)
  return callRpc(client, name, { [key]: entityId, p_comment_id: commentId })
}

/** Compteur de partages d'une vidéo (seul type partagé compté par le web). */
export async function incrementVideoShare(client, videoId) {
  return callRpc(client, 'moxt_video_increment_share', { p_video_id: videoId })
}

/** Abonnement au format du store web (accountSlice.upsertPublisherSubscription.prepare). */
export function buildPublisherSubscription(values, now = new Date()) {
  const iso = now.toISOString()
  return {
    id: values.id || createEngagementId('SUB'),
    userId: values.userId,
    publisherType: values.publisherType,
    publisherId: values.publisherId,
    notifyPref: values.notifyPref || 'all',
    publisherName: values.publisherName || '',
    publisherPath: values.publisherPath || '',
    createdAt: values.createdAt || iso,
    updatedAt: iso,
  }
}

/**
 * S'abonner : comme le web, on relit d'abord la ligne existante (contrainte unique
 * subscriber/type/éditeur) pour garder son id et sa date, puis upsert sur `id`.
 */
export async function upsertPublisherSubscription(client, subscription) {
  if (!client) throw new Error('Client Supabase indisponible')
  const { data: existing, error: lookupError } = await client
    .from('publisher_subscriptions')
    .select('id, created_at')
    .eq('subscriber_id', subscription.userId)
    .eq('publisher_type', subscription.publisherType)
    .eq('publisher_id', subscription.publisherId)
    .maybeSingle()
  if (lookupError) throw lookupError

  const row = {
    id: existing?.id || subscription.id,
    subscriber_id: subscription.userId,
    publisher_type: subscription.publisherType,
    publisher_id: subscription.publisherId,
    notify_pref: subscription.notifyPref,
    publisher_name: subscription.publisherName,
    publisher_path: subscription.publisherPath,
    created_at: existing?.created_at || subscription.createdAt,
    updated_at: subscription.updatedAt,
  }
  const { error } = await client.from('publisher_subscriptions').upsert(row, { onConflict: 'id' })
  if (error) throw error
  return { ...subscription, id: row.id, createdAt: row.created_at }
}

/** Se désabonner (même filtre que le web). */
export async function removePublisherSubscription(client, { userId, publisherType, publisherId }) {
  if (!client) throw new Error('Client Supabase indisponible')
  const { error } = await client
    .from('publisher_subscriptions')
    .delete()
    .eq('subscriber_id', userId)
    .eq('publisher_type', publisherType)
    .eq('publisher_id', publisherId)
  if (error) throw error
}

/** Bascule optimiste d'un tableau de j'aime (même logique que les reducers du web). */
export function toggleLikeList(likes, userId) {
  const list = Array.isArray(likes) ? [...likes] : []
  if (!userId) return list
  const idx = list.indexOf(userId)
  if (idx === -1) list.push(userId)
  else list.splice(idx, 1)
  return list
}
