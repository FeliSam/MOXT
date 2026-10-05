/**
 * Avis (table `reviews`), mêmes lectures et écritures que le web :
 * moxt-react/src/features/reviews/reviewRemote.js (syncReviewRemote, fetchReviewsForTargetScope)
 * et reviewSlice.createReview.prepare (format de l'avis).
 */
import { fromRow } from '../utils/remoteRowMapper.js'
import {
  PUBLICATION_REVIEW_TARGET_TYPES,
  REVIEW_DISPUTE_STATUS,
  REVIEW_TARGET_TYPES,
} from '../utils/reviewUtils.js'
import { createEngagementId } from './engagementService.js'

export const REVIEW_SCOPE_FETCH_LIMIT = 100
export const REVIEW_COMMENT_MIN_LENGTH = 5

/** Avis au format de reviewSlice.createReview.prepare (id `REV-…`). */
export function buildReview(values, now = new Date()) {
  const iso = now.toISOString()
  return {
    id: values.id || createEngagementId('REV'),
    targetType: values.targetType,
    targetId: values.targetId,
    authorId: values.authorId,
    authorName: values.authorName,
    rating: Math.min(5, Math.max(1, Number(values.rating))),
    comment: String(values.comment || '').trim(),
    status: values.status || 'published',
    replyText: values.replyText || '',
    replyAt: values.replyAt || null,
    replyBy: values.replyBy || null,
    disputeStatus: values.disputeStatus || REVIEW_DISPUTE_STATUS.NONE,
    disputeReason: values.disputeReason || '',
    disputedAt: values.disputedAt || null,
    createdAt: values.createdAt || iso,
    updatedAt: iso,
  }
}

export function reviewToRemoteRow(review) {
  return {
    id: review.id,
    target_type: review.targetType,
    target_id: review.targetId,
    author_id: review.authorId,
    author_name: review.authorName || '',
    rating: Number(review.rating) || 5,
    comment: review.comment?.trim() || '',
    status: review.status || 'published',
    moderated_at: review.moderatedAt || null,
    moderated_by: review.moderatedBy || null,
    reply_text: review.replyText?.trim() || null,
    reply_at: review.replyAt || null,
    reply_by: review.replyBy || null,
    dispute_status: review.disputeStatus || 'none',
    dispute_reason: review.disputeReason?.trim() || '',
    disputed_at: review.disputedAt || null,
    created_at: review.createdAt || new Date().toISOString(),
    updated_at: review.updatedAt || review.createdAt || new Date().toISOString(),
  }
}

function isAuthorTargetConflict(error) {
  return Boolean(
    error &&
      (error.code === '23505' ||
        /reviews_author_target_uidx|duplicate key|unique constraint/i.test(error.message || '')),
  )
}

/**
 * Enregistre un avis : upsert sur `id` ; en cas de conflit auteur + cible, met à jour
 * l'avis existant (note, commentaire, nom, date). L'auteur est celui de la session.
 * Renvoie l'id de la ligne écrite.
 */
export async function syncReview(client, review) {
  if (!client) throw new Error('client Supabase absent')
  let authorId = review.authorId
  if (client.auth?.getUser) {
    const { data, error } = await client.auth.getUser()
    if (error) throw error
    authorId = data?.user?.id || null
  }
  if (!authorId) throw new Error('not authenticated')

  const row = reviewToRemoteRow({ ...review, authorId })
  let { error } = await client.from('reviews').upsert(row, { onConflict: 'id' })

  if (isAuthorTargetConflict(error)) {
    const { data: existing, error: fetchError } = await client
      .from('reviews')
      .select('id')
      .eq('author_id', authorId)
      .eq('target_type', row.target_type)
      .eq('target_id', row.target_id)
      .maybeSingle()
    if (fetchError) throw fetchError
    if (existing?.id) {
      ;({ error } = await client
        .from('reviews')
        .update({ rating: row.rating, comment: row.comment, author_name: row.author_name, updated_at: row.updated_at })
        .eq('id', existing.id))
      if (!error) return existing.id
    }
  }

  if (error) throw error
  return row.id
}

/**
 * Avis visibles d'un profil ou d'une entreprise, avec ceux des publications liées.
 * @param {*} client
 * @param {{ profileTargetType: string, profileTargetId: string, publicationIds?: Record<string, string[]>, ownerProfileId?: string | null }} scope
 */
export async function fetchReviewsForTargetScope(
  client,
  { profileTargetType, profileTargetId, publicationIds = {}, ownerProfileId = null },
) {
  if (!client || !profileTargetType || !profileTargetId) return []
  const scoped = (query) => query.order('created_at', { ascending: false }).limit(REVIEW_SCOPE_FETCH_LIMIT)
  const queries = [
    scoped(client.from('reviews').select('*').eq('target_type', profileTargetType).eq('target_id', profileTargetId)),
  ]
  if (ownerProfileId && profileTargetType === REVIEW_TARGET_TYPES.BUSINESS && ownerProfileId !== profileTargetId) {
    queries.push(
      scoped(client.from('reviews').select('*').eq('target_type', REVIEW_TARGET_TYPES.USER_PROFILE).eq('target_id', ownerProfileId)),
    )
  }
  for (const targetType of PUBLICATION_REVIEW_TARGET_TYPES) {
    const ids = publicationIds[targetType]
    if (!Array.isArray(ids) || !ids.length) continue
    queries.push(scoped(client.from('reviews').select('*').eq('target_type', targetType).in('target_id', ids)))
  }
  const results = await Promise.all(queries)
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
  const merged = new Map()
  for (const result of results) {
    for (const row of result.data || []) if (row?.id) merged.set(row.id, row)
  }
  return [...merged.values()].map((row) => fromRow(row)).filter(Boolean)
}
