import { fromRow } from '../../services/remoteRowMapper'
import { supabase } from '../../services/supabaseClient'
import { REVIEW_TARGET_TYPES } from '@moxt/shared/utils/reviewUtils.js'

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

export function reviewFromRemoteRow(row) {
  if (!row) return null
  return fromRow(row)
}

function authorEditableFields(row) {
  return {
    rating: row.rating,
    comment: row.comment,
    author_name: row.author_name,
    updated_at: row.updated_at,
  }
}

/** Sync avis — aligne author_id sur la session et gère le conflit auteur+cible. */
export async function syncReviewRemote(review) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user?.id) throw new Error('not authenticated')

  const row = reviewToRemoteRow({ ...review, authorId: user.id })
  let { error } = await supabase.from('reviews').upsert(row, { onConflict: 'id' })

  const isAuthorTargetConflict =
    error &&
    (error.code === '23505' ||
      /reviews_author_target_uidx|duplicate key|unique constraint/i.test(error.message || ''))

  if (isAuthorTargetConflict) {
    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('id')
      .eq('author_id', user.id)
      .eq('target_type', row.target_type)
      .eq('target_id', row.target_id)
      .maybeSingle()
    if (fetchError) throw fetchError
    if (existing?.id) {
      ;({ error } = await supabase
        .from('reviews')
        .update(authorEditableFields(row))
        .eq('id', existing.id))
      if (!error) return existing.id
    }
  }

  if (error) throw error
  return row.id
}

/** Mise à jour propriétaire (réponse / contestation) — champs limités. */
export async function syncReviewOwnerRemote(review) {
  const row = reviewToRemoteRow(review)
  const { error } = await supabase
    .from('reviews')
    .update({
      reply_text: row.reply_text,
      reply_at: row.reply_at,
      reply_by: row.reply_by,
      dispute_status: row.dispute_status,
      dispute_reason: row.dispute_reason,
      disputed_at: row.disputed_at,
      updated_at: row.updated_at,
    })
    .eq('id', row.id)
  if (error) throw error
}

async function deleteReviewRows(query) {
  const { data, error } = await query.select('id')
  if (error) throw error
  return data?.length || 0
}

/** Supprime un avis — retente par auteur+cible si l'id local ne correspond pas au back. */
export async function deleteReviewRemote(reviewId, review) {
  if (reviewId) {
    const deleted = await deleteReviewRows(
      supabase.from('reviews').delete().eq('id', reviewId),
    )
    if (deleted > 0) return
  }

  if (review?.authorId && review?.targetType && review?.targetId) {
    const deleted = await deleteReviewRows(
      supabase
        .from('reviews')
        .delete()
        .eq('author_id', review.authorId)
        .eq('target_type', review.targetType)
        .eq('target_id', review.targetId),
    )
    if (deleted > 0) return
  }

  if (reviewId) {
    const deleted = await deleteReviewRows(
      supabase.from('reviews').delete().eq('id', reviewId),
    )
    if (deleted > 0) return
  }

  throw new Error('review delete failed')
}

export function resolveReviewTargetHref(review, publication) {
  if (publication?.path) return publication.path
  if (!review?.targetType || !review?.targetId) return null
  switch (review.targetType) {
    case REVIEW_TARGET_TYPES.USER_PROFILE:
      return `/users/${review.targetId}/publications`
    case REVIEW_TARGET_TYPES.BUSINESS:
      return `/businesses/${review.targetId}`
    default:
      return null
  }
}
