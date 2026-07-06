import { STORAGE_SCHEMA_VERSION, writeStorageManifest } from './storageRegistry'

const MIGRATION_KEY = 'moxt-legacy-migration-v1'
export const LEGACY_MIGRATION_VERSION = 2

const COLLECTIONS = [
  {
    target: 'moxt-transfers-v1',
    sources: ['transfers', 'fx_transfers', 'ex_transfers'],
    normalize: normalizeTransfer,
  },
  {
    target: 'moxt-businesses-v1',
    sources: [
      'fx_business_profiles',
      'fx_businesses',
      'businessProfiles',
      'businesses',
      'moxt_businesses',
      'companies',
      'ex_businesses',
    ],
    normalize: normalizeBusiness,
  },
  {
    target: 'moxt-parcels-v1',
    sources: ['fx_parcel_posts', 'fx_parcels', 'parcels', 'ex_parcels'],
    normalize: normalizeParcel,
  },
  {
    target: 'moxt-p2p-offers-v1',
    sources: ['fx_p2p_offers', 'p2pOffers', 'fx_p2p', 'ex_p2p'],
    normalize: normalizeItem,
  },
  {
    target: 'moxt-p2p-orders-v1',
    sources: ['fx_p2p_orders', 'p2pOrders'],
    normalize: normalizeItem,
  },
  {
    target: 'moxt-listings-v1',
    sources: [
      'moxt_sales',
      'moxt_sales_v238',
      'moxt_sales_v255',
      'fx_moxt_listings_v600',
      'listings',
    ],
    normalize: normalizeListing,
  },
  {
    target: 'moxt-jobs-v1',
    sources: ['fx_v162_jobs', 'fx_jobs', 'jobs', 'jobs_v162', 'ex_jobs'],
    normalize: normalizeItem,
  },
  {
    target: 'moxt-job-applications-v1',
    sources: [
      'fx_v171_job_applications',
      'fx_v162_job_applications',
      'fx_job_applications',
      'jobApplications',
      'applications',
      'ex_applications',
    ],
    normalize: normalizeItem,
  },
  {
    target: 'moxt-events-v1',
    sources: ['fx_v162_events', 'fx_events', 'events', 'events_v162', 'ex_events'],
    normalize: normalizeEvent,
  },
  {
    target: 'moxt-event-registrations-v1',
    sources: [
      'fx_v172_event_tickets',
      'fx_event_registrations',
      'eventRegistrations',
      'registrations',
      'ex_event_registrations',
    ],
    normalize: normalizeItem,
  },
  {
    target: 'moxt-conversations-v1',
    sources: ['fx_moxt_conversations_v600', 'fx_chat_threads_v141', 'conversations'],
    normalize: normalizeConversation,
  },
  {
    target: 'moxt-support-v1',
    sources: ['support_messages', 'fx_support_conversations_v94'],
    normalize: normalizeSupport,
  },
  {
    target: 'moxt-notifications-v1',
    sources: [
      'moxt_notifications_v269',
      'moxt_notifications_v254',
      'moxt_structured_notifications',
      'moxt_notifications',
      'fx_notifications',
      'fx_v204_notifications',
      'fx_v172_notifications',
      'notifications',
    ],
    normalize: normalizeNotification,
  },
  // moxt-audit-v1 retiré : l'audit reste en mémoire uniquement (données sensibles)
]

function parse(storage, key) {
  try {
    const raw = storage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function identityFor(item) {
  return String(
    item?.id ||
      item?.uuid ||
      [item?.title, item?.name, item?.createdAt, item?.userId].filter(Boolean).join('|'),
  )
}

function migrateCollection(storage, definition) {
  const current = parse(storage, definition.target)
  if (Array.isArray(current) && current.length > 0) return 0

  const seen = new Set()
  const migrated = definition.sources
    .flatMap((key) => asArray(parse(storage, key)))
    .map((item, index) => definition.normalize(item, index))
    .filter(Boolean)
    .filter((item) => {
      const identity = identityFor(item)
      if (!identity || seen.has(identity)) return false
      seen.add(identity)
      return true
    })

  if (migrated.length > 0) storage.setItem(definition.target, JSON.stringify(migrated))
  return migrated.length
}

function normalizeItem(item, index) {
  if (!item || typeof item !== 'object') return null
  return {
    ...item,
    id: item.id || item.uuid || `LEGACY-${Date.now().toString(36)}-${index}`,
    createdAt: item.createdAt || item.date || new Date(0).toISOString(),
  }
}

function normalizeTransfer(item, index) {
  const base = normalizeItem(item, index)
  if (!base) return null
  const status = item.status || 'pending_payment'
  const direction =
    item.direction === 'rub-to-xof'
      ? 'RU_TO_BJ'
      : item.direction === 'xof-to-rub'
        ? 'BJ_TO_RU'
        : item.direction || 'BJ_TO_RU'
  const amountSent = Number(item.amountSent || item.amount || item.sendAmount || 0)
  const currencyFrom = item.currencyFrom || (direction === 'RU_TO_BJ' ? 'RUB' : 'XOF')
  const currencyTo = item.currencyTo || (direction === 'RU_TO_BJ' ? 'XOF' : 'RUB')
  const rate = Number(item.rate || 1)
  const feePercent = Number(item.feePercent || 0)
  const fees = Number(item.fees ?? (amountSent * feePercent) / 100)
  return {
    ...base,
    userId: item.userId || item.ownerId || item.createdBy || '',
    status,
    direction,
    amount: amountSent,
    amountSent,
    amountReceived: Number(item.amountReceived || item.receiveAmount || amountSent * rate),
    totalToPay: Number(item.totalToPay || amountSent + fees),
    currencyFrom,
    currencyTo,
    rate,
    feePercent,
    fees,
    sender: item.sender || {
      firstName: item.senderFirstName || '',
      lastName: item.senderLastName || '',
      phone: item.senderPhone || '',
      method: item.senderMethod || '',
    },
    recipient: item.recipient || {
      firstName: item.recipientFirstName || '',
      lastName: item.recipientLastName || '',
      phone: item.recipientPhone || '',
      method: item.recipientMethod || '',
    },
    paymentDeadlineAt: item.paymentDeadlineAt || base.createdAt,
    timeline: Array.isArray(item.timeline) ? item.timeline : [{ status, at: base.createdAt }],
  }
}

function normalizeBusiness(item, index) {
  const base = normalizeItem(item, index)
  if (!base) return null
  return {
    ...base,
    ownerId: item.ownerId || item.userId || item.createdBy || item.email || '',
    name: item.name || item.businessName || item.companyName || 'Entreprise',
    sector: item.sector || item.category || 'Autre',
    country: item.country || '',
    city: item.city || '',
    phone: item.phone || item.whatsapp || '',
    description: item.description || item.about || '',
    services: asArray(item.services),
    status: item.status || item.verificationStatus || 'pending_review',
    rating: Number(item.rating || 0),
  }
}

function normalizeParcel(item, index) {
  const base = normalizeItem(item, index)
  if (!base) return null
  const capacity = Number(item.capacityKg || item.capacity || item.kg || 0)
  return {
    ...base,
    ownerId: item.ownerId || item.userId || item.createdBy || '',
    origin: item.origin || item.from || item.departure || '',
    destination: item.destination || item.to || item.arrival || '',
    capacityKg: capacity,
    remainingKg: Number(item.remainingKg ?? capacity),
    pricePerKg: Number(item.pricePerKg || item.price || 0),
    reservations: asArray(item.reservations),
    status: item.status || 'active',
  }
}

function normalizeListing(item, index) {
  const base = normalizeItem(item, index)
  if (!base) return null
  return {
    ...base,
    title: item.title || item.name || item.productName || 'Annonce',
    description: item.description || item.details || '',
    category: item.category || item.type || 'other',
    price: Number(item.price || 0),
    currency: item.currency || 'XOF',
    city: item.city || item.location || '',
    ownerId: item.ownerId || item.userId || item.createdBy || item.sellerId || '',
    sellerName: item.sellerName || item.businessName || item.ownerName || '',
    status: item.status || 'active',
    favorites: asArray(item.favorites),
    images: asArray(item.images),
    views: Number(item.views || 0),
  }
}

function normalizeEvent(item, index) {
  const base = normalizeItem(item, index)
  if (!base) return null
  return {
    ...base,
    title: item.title || item.name || 'Événement',
    capacity: Number(item.capacity || item.seats || 0),
    price: Number(item.price || 0),
    status: item.status || 'published',
  }
}

function normalizeConversation(item, index) {
  const base = normalizeItem(item, index)
  if (!base) return null
  const participantIds = asArray(item.participantIds).length
    ? item.participantIds
    : asArray(item.participants).map((participant) =>
        typeof participant === 'object' ? participant.id : participant,
      )
  return {
    ...base,
    title: item.title || item.subject || 'Conversation',
    participantIds: [...new Set(participantIds.filter(Boolean))],
    // messages non embarqués — chargés à la demande depuis Supabase (lazy-load)
    messages: [],
    unreadBy: item.unreadBy || {},
    relatedType: item.relatedType || 'general',
    relatedId: item.relatedId || null,
    status: item.status || 'active',
    updatedAt: item.updatedAt || base.createdAt,
  }
}

function normalizeSupport(item, index) {
  const base = normalizeConversation(item, index)
  if (!base) return null
  return {
    ...base,
    subject: item.subject || item.title || 'Demande de support',
    priority: item.priority || 'normal',
    status: item.status || 'waiting_agent',
  }
}

function normalizeNotification(item, index) {
  const base = normalizeItem(item, index)
  if (!base) return null
  return {
    ...base,
    userId: item.userId || item.targetId || 'all',
    title: item.title || 'Notification',
    message: item.message || item.text || '',
    type: item.type || item.module || 'system',
    link: item.link || item.href || null,
    read: Boolean(item.read),
  }
}

/**
 * Nettoie les données stales suite aux changements d'architecture :
 * - Supprime les messages embarqués dans les conversations (lazy-load depuis v3)
 * - Supprime la clé d'audit en localStorage (données sensibles, v3)
 * - Supprime la copie de session dupliquée (v3)
 * Idempotente — sûre à appeler à chaque démarrage.
 */
export function cleanupLocalStorage(storage = globalThis.localStorage) {
  if (!storage) return

  // Supprimer l'audit du localStorage (données sensibles)
  storage.removeItem('moxt-audit-v1')
  // Supprimer la copie dupliquée du token de session
  storage.removeItem('moxt-session-v1')

  // Retirer les messages embarqués des conversations stockées
  try {
    const raw = storage.getItem('moxt-conversations-v1')
    if (!raw) return
    const conversations = JSON.parse(raw)
    if (!Array.isArray(conversations)) return
    const hasEmbeddedMessages = conversations.some(
      (c) => Array.isArray(c.messages) && c.messages.length > 0,
    )
    if (hasEmbeddedMessages) {
      const cleaned = conversations.map(({ messages: _msgs, messagesLoaded: _ml, ...conv }) => conv)
      storage.setItem('moxt-conversations-v1', JSON.stringify(cleaned))
    }
  } catch {
    // localStorage corrompu — ignorer
  }
}

export function migrateLegacyStorage(storage = globalThis.localStorage) {
  if (!storage) return { migrated: 0 }

  const migrated = COLLECTIONS.reduce(
    (total, definition) => total + migrateCollection(storage, definition),
    0,
  )

  storage.setItem(
    MIGRATION_KEY,
    JSON.stringify({
      version: LEGACY_MIGRATION_VERSION,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      migrated,
      checkedAt: new Date().toISOString(),
    }),
  )
  writeStorageManifest(
    {
      migrationVersion: LEGACY_MIGRATION_VERSION,
      migratedRecords: migrated,
    },
    storage,
  )
  return { migrated }
}
