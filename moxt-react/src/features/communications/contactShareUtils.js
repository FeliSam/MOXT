/** Contact share helpers for messaging attachments. */

export function isContactAttachment(attachment) {
  return Boolean(attachment && attachment.kind === 'contact' && attachment.userId)
}

export function buildContactAttachment(contact) {
  if (!contact?.userId) return null
  const name = String(contact.name || '').trim() || 'MOXT'
  return {
    kind: 'contact',
    userId: contact.userId,
    name,
    avatarUrl: contact.avatarUrl || null,
    city: contact.city || '',
    path: contact.path || `/users/${contact.userId}/publications`,
  }
}

/**
 * Build a deduped contact list from subscriptions (I follow) + subscribers (follow me).
 * Only user publishers (not businesses).
 */
export function buildShareableContacts({
  userId,
  subscriptions = [],
  profileById = {},
} = {}) {
  if (!userId) return { following: [], followers: [] }

  const following = []
  const followers = []
  const seenFollowing = new Set()
  const seenFollowers = new Set()

  for (const item of subscriptions) {
    if (item.userId === userId && item.publisherType === 'user' && item.publisherId) {
      const id = String(item.publisherId)
      if (id === String(userId) || seenFollowing.has(id)) continue
      seenFollowing.add(id)
      const profile = profileById[id] || {}
      following.push({
        userId: id,
        name:
          item.publisherName ||
          [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
          profile.email ||
          id,
        avatarUrl: profile.avatarUrl || null,
        city: profile.city || '',
        path: item.publisherPath || `/users/${id}/publications`,
        section: 'following',
      })
    }

    if (item.publisherType === 'user' && item.publisherId === userId && item.userId) {
      const id = String(item.userId)
      if (id === String(userId) || seenFollowers.has(id)) continue
      seenFollowers.add(id)
      const profile = profileById[id] || {}
      followers.push({
        userId: id,
        name:
          [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
          profile.email ||
          id,
        avatarUrl: profile.avatarUrl || null,
        city: profile.city || '',
        path: `/users/${id}/publications`,
        section: 'followers',
      })
    }
  }

  following.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  followers.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  return { following, followers }
}

export function filterShareableContacts(contacts, query = '') {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return contacts
  return contacts.filter((item) => {
    const hay = `${item.name || ''} ${item.city || ''}`.toLowerCase()
    return hay.includes(q)
  })
}
