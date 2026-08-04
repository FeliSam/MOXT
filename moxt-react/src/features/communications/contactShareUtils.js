/** Contact share helpers for messaging attachments. */

export const CONTACT_NAME_FALLBACK = 'Contact MOXT'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isContactAttachment(attachment) {
  return Boolean(attachment && attachment.kind === 'contact' && attachment.userId)
}

export function resolveContactDisplayName(...candidates) {
  for (const raw of candidates) {
    const name = String(raw || '').trim()
    if (!name) continue
    if (UUID_RE.test(name)) continue
    return name
  }
  return CONTACT_NAME_FALLBACK
}

export function buildContactAttachment(contact) {
  if (!contact?.userId) return null
  const name = resolveContactDisplayName(contact.name)
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
  nameFallback = CONTACT_NAME_FALLBACK,
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
      const profileName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
      following.push({
        userId: id,
        name: resolveContactDisplayName(
          item.publisherName,
          profileName,
          profile.email,
          nameFallback,
        ),
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
      const profileName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
      followers.push({
        userId: id,
        name: resolveContactDisplayName(profileName, profile.email, nameFallback),
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

export function collectShareableContactIds({ userId, subscriptions = [] } = {}) {
  if (!userId) return []
  const ids = new Set()
  for (const item of subscriptions) {
    if (item.userId === userId && item.publisherType === 'user' && item.publisherId) {
      const id = String(item.publisherId)
      if (id !== String(userId)) ids.add(id)
    }
    if (item.publisherType === 'user' && item.publisherId === userId && item.userId) {
      const id = String(item.userId)
      if (id !== String(userId)) ids.add(id)
    }
  }
  return [...ids]
}
