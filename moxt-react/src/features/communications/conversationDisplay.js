import { supabase } from '../../services/supabaseClient'
import { isProfileVerified } from '../profile/userProfileUtils'
import { messagesText } from './messagesI18n'
import {
  fetchParticipantProfiles,
  formatProfileName,
  getOtherParticipantId,
} from '@moxt/shared/domain/conversationRules.js'

// Règles messagerie : source unique partagée web + mobile.
export {
  buildParticipantProfilesMap,
  formatProfileName,
  getOtherParticipantId,
  isParticipantDisplayName,
  mergeParticipantProfiles,
  profileFromRemoteRow,
} from '@moxt/shared/domain/conversationRules.js'

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

export async function fetchParticipantProfilesFromRemote(participantIds) {
  return fetchParticipantProfiles(supabase, participantIds)
}
