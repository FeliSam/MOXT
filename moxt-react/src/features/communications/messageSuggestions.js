import { buildContextPreview } from './conversationTimeline'
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

function listingSuggestions({ role, title, subtitle, peerName }) {
  const item = truncate(title) || 'cette annonce'
  if (role === 'owner') {
    return uniqueSuggestions([
      `Bonjour, merci pour votre intérêt pour « ${item} ».`,
      `Bonjour ${peerName || ''}, l'article est toujours disponible.`,
      subtitle ? `Le prix indiqué (${subtitle}) reste valable.` : `Je peux vous donner plus de détails sur l'article.`,
      `N'hésitez pas si vous avez d'autres questions.`,
    ])
  }
  return uniqueSuggestions([
    `Bonjour, « ${item} » est-il encore disponible ?`,
    subtitle ? `Bonjour, le prix affiché (${subtitle}) est-il négociable ?` : `Bonjour, pouvez-vous me donner plus de détails ?`,
    `Bonjour ${peerName || ''}, je suis intéressé(e) par cette annonce.`,
    `Serait-il possible d'organiser une visite ou un essai ?`,
    `Quelle est la localisation pour la remise ?`,
    `Acceptez-vous un paiement sécurisé via MOXT ?`,
  ])
}

function jobSuggestions({ role, title, subtitle, peerName }) {
  const item = truncate(title) || 'ce poste'
  if (role === 'owner') {
    return uniqueSuggestions([
      `Bonjour, merci pour votre candidature concernant « ${item} ».`,
      `Bonjour ${peerName || ''}, le poste est toujours ouvert.`,
      `Pouvez-vous m'envoyer votre CV et une brève présentation ?`,
      subtitle ? `Le secteur recherché : ${subtitle}.` : `Je reste disponible pour échanger sur le profil recherché.`,
    ])
  }
  return uniqueSuggestions([
    `Bonjour, le poste « ${item} » est-il toujours disponible ?`,
    `Bonjour ${peerName || ''}, je souhaite postuler à cette offre.`,
    `Pouvez-vous me préciser le processus de recrutement ?`,
    subtitle ? `Le domaine « ${subtitle} » me correspond bien.` : `Je peux vous transmettre mon CV dès maintenant.`,
  ])
}

function parcelSuggestions({ role, title, subtitle, peerName }) {
  const item = truncate(title) || 'ce trajet'
  if (role === 'owner') {
    return uniqueSuggestions([
      `Bonjour, merci pour votre message concernant ${item}.`,
      `Bonjour ${peerName || ''}, il reste de la place disponible.`,
      subtitle ? `Tarif actuel : ${subtitle}.` : `Indiquez-moi le poids et le contenu de votre colis.`,
      `Quels sont vos délais de dépôt et de retrait ?`,
    ])
  }
  return uniqueSuggestions([
    `Bonjour, avez-vous encore de la place pour ${item} ?`,
    subtitle ? `Le tarif affiché (${subtitle}) me convient.` : `Bonjour ${peerName || ''}, je souhaite réserver un envoi.`,
    `Quels types d'objets acceptez-vous ?`,
    `Pouvez-vous confirmer les dates de départ et d'arrivée ?`,
  ])
}

function eventSuggestions({ role, title, subtitle, peerName }) {
  const item = truncate(title) || 'cet événement'
  if (role === 'owner') {
    return uniqueSuggestions([
      `Bonjour, merci pour votre intérêt pour « ${item} ».`,
      `Bonjour ${peerName || ''}, des places sont encore disponibles.`,
      subtitle ? `Tarif / accès : ${subtitle}.` : `Je peux vous expliquer le déroulement de l'événement.`,
      `Souhaitez-vous que je vous envoie le programme ?`,
    ])
  }
  return uniqueSuggestions([
    `Bonjour, reste-t-il des places pour « ${item} » ?`,
    `Bonjour ${peerName || ''}, comment s'inscrire à l'événement ?`,
    subtitle ? `Concernant l'accès : ${subtitle}.` : `Pouvez-vous préciser le lieu et l'horaire ?`,
    `L'événement est-il accessible et ouvert au public ?`,
  ])
}

function businessSuggestions({ role, title, peerName }) {
  const item = truncate(title) || 'votre entreprise'
  if (role === 'owner') {
    return uniqueSuggestions([
      `Bonjour, merci pour votre message.`,
      `Bonjour ${peerName || ''}, comment puis-je vous aider ?`,
      `Nous serions ravis de répondre à vos questions sur ${item}.`,
      `Souhaitez-vous un rendez-vous ou un devis personnalisé ?`,
    ])
  }
  return uniqueSuggestions([
    `Bonjour, quels services propose ${item} ?`,
    `Bonjour ${peerName || ''}, pouvez-vous me communiquer vos horaires ?`,
    `Je souhaite obtenir un devis, est-ce possible ?`,
    `Proposez-vous une prestation adaptée à mon besoin ?`,
  ])
}

function transferSuggestions({ role, title, peerName }) {
  if (role === 'owner') {
    return uniqueSuggestions([
      `Bonjour ${peerName || ''}, je consulte le statut de votre transfert.`,
      `Pouvez-vous confirmer la réception des fonds ?`,
      `Avez-vous bien transmis la preuve de paiement ?`,
      `Je reste disponible pour finaliser l'opération en toute sécurité.`,
    ])
  }
  return uniqueSuggestions([
    `Bonjour, pouvez-vous confirmer le statut du transfert ?`,
    `Bonjour ${peerName || ''}, la preuve de paiement est-elle suffisante ?`,
    `Quel est le délai restant pour finaliser l'opération ?`,
    `Merci de me tenir informé(e) de l'avancement.`,
  ])
}

function p2pSuggestions({ role, subtitle, peerName }) {
  if (role === 'owner') {
    return uniqueSuggestions([
      `Bonjour ${peerName || ''}, mon offre est toujours active.`,
      subtitle ? `Le taux proposé est ${subtitle}.` : `Je peux confirmer les conditions de l'échange.`,
      `Quel mode de paiement préférez-vous ?`,
      `Restons vigilants et échangeons uniquement via MOXT.`,
    ])
  }
  return uniqueSuggestions([
    `Bonjour, votre offre est-elle toujours disponible ?`,
    subtitle ? `Le taux affiché (${subtitle}) me convient.` : `Bonjour ${peerName || ''}, je souhaite échanger avec vous.`,
    `Quel mode de paiement acceptez-vous ?`,
    `Pouvez-vous confirmer le montant et les conditions ?`,
  ])
}

function generalSuggestions({ role, peerName }) {
  if (role === 'owner') {
    return uniqueSuggestions([
      `Bonjour ${peerName || ''}, merci pour votre message.`,
      `Comment puis-je vous aider ?`,
      `Je reste disponible pour répondre à vos questions.`,
    ])
  }
  return uniqueSuggestions([
    `Bonjour ${peerName || ''}, je souhaite en savoir plus.`,
    `Merci pour votre retour.`,
    `Pouvez-vous préciser votre demande ?`,
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
}) {
  const role = resolveConversationRole(conversation, userId)
  const type = relatedPreview?.type || conversation?.relatedType || 'general'
  const builder = BUILDERS[type] || BUILDERS.general
  const pool = builder({
    role,
    title: relatedPreview?.title || conversation?.title,
    subtitle: relatedPreview?.subtitle,
    peerName: peerName?.split(' ')[0] || peerName,
  })

  const available = filterAlreadySentSuggestions(pool, sentTexts)
  return available.slice(0, limit)
}

export function messageSuggestionsForConversation(state, conversation, userId, peerName) {
  const relatedPreview = getLatestRelatedPreview(conversation, state)
  const sentTexts = sentTextsFromConversation(conversation, userId)
  return buildMessageSuggestions({
    conversation,
    userId,
    relatedPreview,
    peerName,
    sentTexts,
  })
}
