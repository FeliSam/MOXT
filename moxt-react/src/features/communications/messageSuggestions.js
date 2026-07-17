import { buildContextPreview } from './conversationTimeline'
import { messagesText } from './messagesI18n'
import { resolveRelatedSnapshot } from './relatedSnapshot'

function truncate(text, max = 48) {
  if (!text) return ''
  const value = String(text).trim()
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`
}

function uniqueSuggestions(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))]
}

function normalizeForMatch(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Retire les suggestions déjà envoyées dans le fil pour laisser place aux suivantes. */
export function filterAlreadySentSuggestions(pool, sentTexts = []) {
  const normalizedSent = sentTexts.map(normalizeForMatch).filter(Boolean)
  if (!normalizedSent.length) return pool

  return pool.filter((suggestion) => {
    const normalizedSuggestion = normalizeForMatch(suggestion)
    if (!normalizedSuggestion) return false
    return !normalizedSent.some((sent) => {
      if (sent === normalizedSuggestion) return true
      if (sent.includes(normalizedSuggestion) || normalizedSuggestion.includes(sent)) return true
      const suggestionWords = normalizedSuggestion.split(' ').filter((word) => word.length > 3)
      if (!suggestionWords.length) return false
      const matched = suggestionWords.filter((word) => sent.includes(word)).length
      return matched / suggestionWords.length >= 0.65
    })
  })
}

export function sentTextsFromConversation(conversation, userId) {
  if (!conversation?.messages?.length) return []
  return conversation.messages
    .filter((message) => !userId || message.senderId === userId)
    .map((message) => message.text)
    .filter(Boolean)
}

export function resolveConversationRole(conversation, userId) {
  if (!conversation || !userId) return 'contact'
  if (conversation.createdBy && conversation.createdBy === userId) return 'contact'
  const participants = conversation.participantIds || []
  if (participants.length === 2 && participants.includes(userId)) return 'owner'
  return 'contact'
}

export function getLatestRelatedPreview(conversation, state) {
  if (!conversation) return null
  const contexts = conversation.relatedContexts || []
  const latestContext = contexts.at(-1)
  if (latestContext) {
    const preview = buildContextPreview(latestContext, conversation)
    if (preview?.path) return preview
  }
  return resolveRelatedSnapshot(state, conversation)
}

function listingSuggestions({ role, title, subtitle, peerName, t }) {
  const item = truncate(title) || messagesText(t, 'messages.suggestions.fallback.listing')
  const peer = peerName || ''
  if (role === 'owner') {
    return uniqueSuggestions([
      messagesText(t, 'messages.suggestions.listing.owner.thanks', { item }),
      messagesText(t, 'messages.suggestions.listing.owner.available', { peer }),
      subtitle
        ? messagesText(t, 'messages.suggestions.listing.owner.price', { subtitle })
        : messagesText(t, 'messages.suggestions.listing.owner.details'),
      messagesText(t, 'messages.suggestions.listing.owner.questions'),
    ])
  }
  return uniqueSuggestions([
    messagesText(t, 'messages.suggestions.listing.contact.available', { item }),
    subtitle
      ? messagesText(t, 'messages.suggestions.listing.contact.price', { subtitle })
      : messagesText(t, 'messages.suggestions.listing.contact.details'),
    messagesText(t, 'messages.suggestions.listing.contact.interest', { peer }),
    messagesText(t, 'messages.suggestions.listing.contact.visit'),
    messagesText(t, 'messages.suggestions.listing.contact.location'),
    messagesText(t, 'messages.suggestions.listing.contact.payment'),
  ])
}

function jobSuggestions({ role, title, subtitle, peerName, t }) {
  const item = truncate(title) || messagesText(t, 'messages.suggestions.fallback.job')
  const peer = peerName || ''
  if (role === 'owner') {
    return uniqueSuggestions([
      messagesText(t, 'messages.suggestions.job.owner.thanks', { item }),
      messagesText(t, 'messages.suggestions.job.owner.open', { peer }),
      messagesText(t, 'messages.suggestions.job.owner.cv'),
      subtitle
        ? messagesText(t, 'messages.suggestions.job.owner.sector', { subtitle })
        : messagesText(t, 'messages.suggestions.job.owner.profile'),
    ])
  }
  return uniqueSuggestions([
    messagesText(t, 'messages.suggestions.job.contact.available', { item }),
    messagesText(t, 'messages.suggestions.job.contact.apply', { peer }),
    messagesText(t, 'messages.suggestions.job.contact.process'),
    subtitle
      ? messagesText(t, 'messages.suggestions.job.contact.sector', { subtitle })
      : messagesText(t, 'messages.suggestions.job.contact.cv'),
  ])
}

function parcelSuggestions({ role, title, subtitle, peerName, t }) {
  const item = truncate(title) || messagesText(t, 'messages.suggestions.fallback.parcel')
  const peer = peerName || ''
  if (role === 'owner') {
    return uniqueSuggestions([
      messagesText(t, 'messages.suggestions.parcel.owner.thanks', { item }),
      messagesText(t, 'messages.suggestions.parcel.owner.space', { peer }),
      subtitle
        ? messagesText(t, 'messages.suggestions.parcel.owner.rate', { subtitle })
        : messagesText(t, 'messages.suggestions.parcel.owner.weight'),
      messagesText(t, 'messages.suggestions.parcel.owner.deadlines'),
    ])
  }
  return uniqueSuggestions([
    messagesText(t, 'messages.suggestions.parcel.contact.space', { item }),
    subtitle
      ? messagesText(t, 'messages.suggestions.parcel.contact.rate', { subtitle })
      : messagesText(t, 'messages.suggestions.parcel.contact.book', { peer }),
    messagesText(t, 'messages.suggestions.parcel.contact.items'),
    messagesText(t, 'messages.suggestions.parcel.contact.dates'),
  ])
}

function eventSuggestions({ role, title, subtitle, peerName, t }) {
  const item = truncate(title) || messagesText(t, 'messages.suggestions.fallback.event')
  const peer = peerName || ''
  if (role === 'owner') {
    return uniqueSuggestions([
      messagesText(t, 'messages.suggestions.event.owner.thanks', { item }),
      messagesText(t, 'messages.suggestions.event.owner.seats', { peer }),
      subtitle
        ? messagesText(t, 'messages.suggestions.event.owner.access', { subtitle })
        : messagesText(t, 'messages.suggestions.event.owner.explain'),
      messagesText(t, 'messages.suggestions.event.owner.program'),
    ])
  }
  return uniqueSuggestions([
    messagesText(t, 'messages.suggestions.event.contact.seats', { item }),
    messagesText(t, 'messages.suggestions.event.contact.register', { peer }),
    subtitle
      ? messagesText(t, 'messages.suggestions.event.contact.access', { subtitle })
      : messagesText(t, 'messages.suggestions.event.contact.place'),
    messagesText(t, 'messages.suggestions.event.contact.public'),
  ])
}

function businessSuggestions({ role, title, peerName, t }) {
  const item = truncate(title) || messagesText(t, 'messages.suggestions.fallback.business')
  const peer = peerName || ''
  if (role === 'owner') {
    return uniqueSuggestions([
      messagesText(t, 'messages.suggestions.business.owner.thanks'),
      messagesText(t, 'messages.suggestions.business.owner.help', { peer }),
      messagesText(t, 'messages.suggestions.business.owner.about', { item }),
      messagesText(t, 'messages.suggestions.business.owner.meeting'),
    ])
  }
  return uniqueSuggestions([
    messagesText(t, 'messages.suggestions.business.contact.services', { item }),
    messagesText(t, 'messages.suggestions.business.contact.hours', { peer }),
    messagesText(t, 'messages.suggestions.business.contact.quote'),
    messagesText(t, 'messages.suggestions.business.contact.custom'),
  ])
}

function transferSuggestions({ role, peerName, t }) {
  const peer = peerName || ''
  if (role === 'owner') {
    return uniqueSuggestions([
      messagesText(t, 'messages.suggestions.transfer.owner.status', { peer }),
      messagesText(t, 'messages.suggestions.transfer.owner.received'),
      messagesText(t, 'messages.suggestions.transfer.owner.proof'),
      messagesText(t, 'messages.suggestions.transfer.owner.safe'),
    ])
  }
  return uniqueSuggestions([
    messagesText(t, 'messages.suggestions.transfer.contact.status'),
    messagesText(t, 'messages.suggestions.transfer.contact.proof', { peer }),
    messagesText(t, 'messages.suggestions.transfer.contact.deadline'),
    messagesText(t, 'messages.suggestions.transfer.contact.update'),
  ])
}

function p2pSuggestions({ role, subtitle, peerName, t }) {
  const peer = peerName || ''
  if (role === 'owner') {
    return uniqueSuggestions([
      messagesText(t, 'messages.suggestions.p2p.owner.active', { peer }),
      subtitle
        ? messagesText(t, 'messages.suggestions.p2p.owner.rate', { subtitle })
        : messagesText(t, 'messages.suggestions.p2p.owner.terms'),
      messagesText(t, 'messages.suggestions.p2p.owner.payment'),
      messagesText(t, 'messages.suggestions.p2p.owner.safe'),
    ])
  }
  return uniqueSuggestions([
    messagesText(t, 'messages.suggestions.p2p.contact.available'),
    subtitle
      ? messagesText(t, 'messages.suggestions.p2p.contact.rate', { subtitle })
      : messagesText(t, 'messages.suggestions.p2p.contact.exchange', { peer }),
    messagesText(t, 'messages.suggestions.p2p.contact.payment'),
    messagesText(t, 'messages.suggestions.p2p.contact.confirm'),
  ])
}

function generalSuggestions({ role, peerName, t }) {
  const peer = peerName || ''
  if (role === 'owner') {
    return uniqueSuggestions([
      messagesText(t, 'messages.suggestions.general.owner.thanks', { peer }),
      messagesText(t, 'messages.suggestions.general.owner.help'),
      messagesText(t, 'messages.suggestions.general.owner.available'),
    ])
  }
  return uniqueSuggestions([
    messagesText(t, 'messages.suggestions.general.contact.more', { peer }),
    messagesText(t, 'messages.suggestions.general.contact.thanks'),
    messagesText(t, 'messages.suggestions.general.contact.clarify'),
  ])
}

const BUILDERS = {
  listing: listingSuggestions,
  job: jobSuggestions,
  parcel: parcelSuggestions,
  event: eventSuggestions,
  business: businessSuggestions,
  transfer: transferSuggestions,
  p2p: p2pSuggestions,
  general: generalSuggestions,
}

export function buildMessageSuggestions({
  conversation,
  userId,
  relatedPreview,
  peerName,
  sentTexts = [],
  limit = 3,
  t,
}) {
  const role = resolveConversationRole(conversation, userId)
  const type = relatedPreview?.type || conversation?.relatedType || 'general'
  const builder = BUILDERS[type] || BUILDERS.general
  const pool = builder({
    role,
    title: relatedPreview?.title || conversation?.title,
    subtitle: relatedPreview?.subtitle,
    peerName: peerName?.split(' ')[0] || peerName,
    t,
  })

  const available = filterAlreadySentSuggestions(pool, sentTexts)
  return available.slice(0, limit)
}

export function messageSuggestionsForConversation(state, conversation, userId, peerName, t) {
  const relatedPreview = getLatestRelatedPreview(conversation, state)
  const sentTexts = sentTextsFromConversation(conversation, userId)
  return buildMessageSuggestions({
    conversation,
    userId,
    relatedPreview,
    peerName,
    sentTexts,
    t,
  })
}
