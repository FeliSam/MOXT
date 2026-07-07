function parseIdList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : value ? [value] : []
    } catch {
      return value ? [value] : []
    }
  }
  return []
}

/** Clé stable pour une paire (ou groupe) de participants — une seule conversation par combinaison. */
export function participantKey(participantIds) {
  return [...new Set(parseIdList(participantIds))].filter(Boolean).sort().join(':')
}

export function sameParticipants(left, right) {
  return participantKey(left) === participantKey(right)
}

export function findConversationByParticipants(conversations, participantIds) {
  const key = participantKey(participantIds)
  if (!key) return null
  return (
    conversations.find((item) => participantKey(item.participantIds) === key) ?? null
  )
}
