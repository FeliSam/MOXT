import { supabase } from '../../services/supabaseClient'
import { isProfileVerified } from '../profile/userProfileUtils'
import { messagesText } from './messagesI18n'

export function formatProfileName(profile) {
  if (!profile) return ''
  const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
  return name || profile.name || ''
}

export function getOtherParticipantId(conversation, currentUserId) {
  const ids = conversation?.participantIds || []
  return ids.find((id) => id && id !== currentUserId) || ids[0] || null
}

export function getConversationPeer(conversation, currentUserId, t) {
  const otherId = getOtherParticipantId(conversation, currentUserId)
  const profile = otherId ? conversation?.participantProfiles?.[otherId] : null
  const name =
    formatProfileName(profile) ||
    conversation?.title ||
    messagesText(t, 'messages.userFallback')
  return {
    id: otherId,
    name,
    avatarUrl: profile?.avatarUrl || null,
    verified: isProfileVerified(profile),
    lastActiveAt: profile?.lastActiveAt || null,
  }
}

export function resolveContactProfileFromEntity(entity, t) {
  if (!entity) return null
  const displayName =
    entity.sellerName ||
    entity.organizerName ||
    entity.ownerName ||
    entity.authorName ||
    entity.name
  if (!displayName) return null
  const parts = String(displayName).trim().split(/\s+/)
  return {
    firstName: parts[0] || messagesText(t, 'messages.userFallback'),
    lastName: parts.slice(1).join(' '),
    avatarUrl: entity.ownerAvatarUrl || entity.avatarUrl || entity.logoUrl || null,
  }
}

export function profileFromRemoteRow(row) {
  if (!row?.id) return null
  return {
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    avatarUrl: row.avatar_url || null,
    status: row.status || '',
    verified: row.status === 'verified',
    lastActiveAt: row.last_active_at || null,
  }
}

export async function fetchParticipantProfilesFromRemote(participantIds) {
  const unique = [...new Set(participantIds)].filter(Boolean)
  if (!unique.length || !supabase) return {}

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, status, last_active_at')
    .in('id', unique)
  if (error) throw error

  return Object.fromEntries(
    (data || []).map((row) => [row.id, profileFromRemoteRow(row)]).filter(([, profile]) => profile),
  )
}

export function buildParticipantProfilesMap({
  participantIds,
  remoteProfiles = {},
  currentUser,
  ownerId,
  contactProfile,
}) {
  const profiles = {}
  for (const participantId of participantIds) {
    if (remoteProfiles[participantId]) {
      profiles[participantId] = remoteProfiles[participantId]
      continue
    }
    if (currentUser?.id === participantId) {
      profiles[participantId] = {
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        avatarUrl: currentUser.avatarUrl || null,
        verified: Boolean(currentUser.verified),
        status: currentUser.verified ? 'verified' : '',
      }
      continue
    }
    if (participantId === ownerId && contactProfile) {
      profiles[participantId] = contactProfile
    }
  }
  return profiles
}

export function mergeParticipantProfiles(existing = {}, incoming = {}) {
  const merged = { ...existing }
  for (const [userId, profile] of Object.entries(incoming)) {
    if (!profile) continue
    merged[userId] = { ...merged[userId], ...profile }
  }
  return merged
}
