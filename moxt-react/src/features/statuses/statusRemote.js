function parseJsonField(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function statusFromRemoteRow(row) {
  if (!row?.id) return null
  const images = parseJsonField(row.images, []).filter((url) => typeof url === 'string' && url).slice(0, 4)
  return {
    id: row.id,
    authorId: row.author_id || row.authorId,
    authorName: row.author_name || row.authorName || '',
    authorAvatarUrl: row.author_avatar_url || row.authorAvatarUrl || null,
    businessId: row.business_id || row.businessId || null,
    images,
    caption: row.caption || '',
    isOfficial: row.is_official === true || row.isOfficial === true,
    viewedBy: parseJsonField(row.viewed_by ?? row.viewedBy, []),
    viewers: parseJsonField(row.viewers, {}),
    reactions: parseJsonField(row.reactions, {}),
    createdAt: row.created_at || row.createdAt,
    expiresAt: row.expires_at || row.expiresAt,
  }
}
