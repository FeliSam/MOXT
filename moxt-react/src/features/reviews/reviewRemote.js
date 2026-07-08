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
    created_at: review.createdAt || new Date().toISOString(),
  }
}

export function reviewFromRemoteRow(row) {
  if (!row) return null
  return fromRow(row)
}
