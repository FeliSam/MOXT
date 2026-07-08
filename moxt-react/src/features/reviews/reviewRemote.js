import { fromRow } from '../../services/remoteRowMapper'

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
