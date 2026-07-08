import { fromRow } from '../../services/remoteRowMapper'

export function identityFromRemoteRow(row) {
  if (!row) return null
  const base = fromRow(row)
  return {
    ...base,
    identity:
      row.identity && typeof row.identity === 'object' ? row.identity : base.identity || {},
  }
}

export function identityToRemoteRow(profile) {
  return {
    id: profile.id,
    user_id: profile.userId,
    owner_type: profile.ownerType === 'COMPANY' ? 'COMPANY' : 'PERSON',
    identity: profile.identity || {},
    created_at: profile.createdAt || new Date().toISOString(),
    updated_at: profile.updatedAt || new Date().toISOString(),
  }
}
