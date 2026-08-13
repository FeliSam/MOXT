import { supabase } from '../services/supabaseClient'
import { saveListingRemote } from '../features/marketplace/marketplaceRemote'
import { saveJobApplicationRemote, saveJobRemote } from '../features/jobs/jobRemote'
import { saveBusinessRemote, upsertBusinessDocumentRemote, upsertBusinessMemberRemote, upsertBusinessRequestRemote } from '../features/businesses/businessRemote'
import { syncReviewRemote, syncReviewOwnerRemote, deleteReviewRemote } from '../features/reviews/reviewRemote'
import { identityToRemoteRow } from '../features/identity/identityRemote'
import { p2pOfferToRemoteRow, p2pOrderToRemoteRow, reportToRemoteRow, subscriberBanToRemoteRow, subscriberReportToRemoteRow } from '../features/sync/entityRemote'
import {
  eventRegistrationToRemoteRow,
  parcelRequestToRemoteRow,
} from '../features/sync/interestRemote'
import {
  persistConversationRemote,
  persistMessageForConversation,
  persistMessageRemote,
  resolveCanonicalConversationId,
} from '../features/communications/conversationPersist'
import { normalizeConversation, replaceConversationId } from '../features/communications/communicationSlice'
import { attachmentPreviewLabel } from '../features/communications/attachmentUtils'
import { fromRow } from '../services/remoteRowMapper'
import { addToast } from '../features/ui/uiSlice'
import { sanitizeUserFacingMessage } from '../features/auth/authErrorMessages'
import { authService } from '../features/auth/authService'
import { selectAccountPreferences } from '../features/account/accountSlice'
import { buildTransferRemotePayload } from '../features/transfers/transferRemote'
import { setAdminUsers } from '../features/administration/administrationSlice'

async function triggerEmail(transferId, event) {
  await supabase.functions.invoke('send-email', {
    body: { transferId, event },
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSnake(obj) {
  const map = {
    ownerId: 'owner_id',
    ownerName: 'owner_name',
    businessId: 'business_id',
    businessOwnerId: 'business_owner_id',
    userId: 'user_id',
    createdBy: 'created_by',
    senderId: 'sender_id',
    senderName: 'sender_name',
    reporterId: 'reporter_id',
    authorId: 'author_id',
    authorName: 'author_name',
    targetId: 'target_id',
    targetType: 'target_type',
    relatedId: 'related_id',
    provider: 'provider',
    simulation: 'simulation',
    relatedType: 'related_type',
    relatedPath: 'related_path',
    priority: 'priority',
    archived: 'archived',
    updatedBy: 'updated_by',
    publisherType: 'publisher_type',
    publisherId: 'publisher_id',
    notifyPref: 'notify_pref',
    publisherName: 'publisher_name',
    publisherPath: 'publisher_path',
    subscriberId: 'subscriber_id',
    bannedBy: 'banned_by',
    moderatedAt: 'moderated_at',
    moderatedBy: 'moderated_by',
    replyText: 'reply_text',
    replyAt: 'reply_at',
    replyBy: 'reply_by',
    disputeStatus: 'dispute_status',
    disputeReason: 'dispute_reason',
    disputedAt: 'disputed_at',
    sellerName: 'seller_name',
    sellerType: 'seller_type',
    originCountry: 'origin_country',
    destinationCountry: 'destination_country',
    fromCountry: 'from_country',
    toCountry: 'to_country',
    fromCurrency: 'from_currency',
    toCurrency: 'to_currency',
    departureDate: 'departure_date',
    depositDeadline: 'deposit_deadline',
    distributionDate: 'distribution_date',
    capacityKg: 'capacity_kg',
    remainingKg: 'remaining_kg',
    pricePerKg: 'price_per_kg',
    maxWeightPerItem: 'max_weight_per_item',
    acceptedTypes: 'accepted_types',
    rejectedTypes: 'rejected_types',
    publishAs: 'publish_as',
    travelProofUrl: 'travel_proof_url',
    proofStatus: 'proof_status',
    proofNotes: 'proof_notes',
    passportProofUrl: 'passport_proof_url',
    passportStatus: 'passport_status',
    contractType: 'contract_type',
    experienceLevel: 'experience_level',
    salaryPeriod: 'salary_period',
    startDate: 'start_date',
    applicationDeadline: 'application_deadline',
    applicantName: 'applicant_name',
    requesterName: 'requester_name',
    participantName: 'participant_name',
    expiresAt: 'expires_at',
    startAt: 'start_at',
    logoUrl: 'logo_url',
    bannerUrl: 'banner_url',
    primaryActivity: 'primary_activity',
    secondaryActivity: 'secondary_activity',
    feePercent: 'fee_percent',
    rateReductionToRu: 'rate_reduction_to_ru',
    rateReductionFromRu: 'rate_reduction_from_ru',
    averageDelay: 'average_delay',
    exchangeMethods: 'exchange_methods',
    transferAccounts: 'transfer_accounts',
    transferAcceptanceRequired: 'transfer_acceptance_required',
    // acceptance_* : optionnels (migration) — le sync écrit surtout dans payload jsonb
    acceptanceRequired: 'acceptance_required',
    acceptanceRequestedAt: 'acceptance_requested_at',
    acceptanceExpiresAt: 'acceptance_expires_at',
    acceptanceResolvedAt: 'acceptance_resolved_at',
    previousBusinessId: 'previous_business_id',
    serviceZones: 'service_zones',
    scheduleType: 'schedule_type',
    scheduleSummary: 'schedule_summary',
    participantIds: 'participant_ids',
    unreadBy: 'unread_by',
    archivedBy: 'archived_by',
    pinnedBy: 'pinned_by',
    mutedBy: 'muted_by',
    blockedBy: 'blocked_by',
    replyToId: 'reply_to_id',
    deletedBy: 'deleted_by',
    deliveredTo: 'delivered_to',
    readBy: 'read_by',
    deliveryOptions: 'delivery_options',
    deliveryFee: 'delivery_fee',
    deliveryDelay: 'delivery_delay',
    returnPolicy: 'return_policy',
    paymentMethods: 'payment_methods',
    contactCount: 'contact_count',
    shareCount: 'share_count',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    avatarUrl: 'avatar_url',
    listingId: 'listing_id',
    answeredAt: 'answered_at',
    jobId: 'job_id',
    eventId: 'event_id',
    parcelId: 'parcel_id',
    offerId: 'offer_id',
    buyerId: 'buyer_id',
    buyerName: 'buyer_name',
    sellerId: 'seller_id',
    directionLabel: 'direction_label',
    paymentProof: 'payment_proof',
    businessProof: 'business_proof',
    paymentDeadlineAt: 'payment_deadline_at',
    rateDate: 'rate_date',
    rateSource: 'rate_source',
    receivedAmount: 'received_amount',
    originAirportCode: 'origin_airport_code',
    destinationAirportCode: 'destination_airport_code',
    onlineLink: 'online_link',
    endAt: 'end_at',
    registrationDeadline: 'registration_deadline',
    freeEntry: 'free_entry',
    organizerName: 'organizer_name',
    reviewedAt: 'reviewed_at',
    reviewedBy: 'reviewed_by',
    reviewNote: 'review_note',
    documentIds: 'document_ids',
    deletedAt: 'deleted_at',
    deletedByUser: 'deleted_by_user',
    receivedMethod: 'received_method',
    receivedProof: 'received_proof',
    receivedAt: 'received_at',
    ownerType: 'owner_type',
    addressLine: 'address_line',
    identityProfileId: 'identity_profile_id',
    userName: 'user_name',
    assignedTo: 'assigned_to',
    activityVisibility: 'activity_visibility',
    firstName: 'first_name',
    lastName: 'last_name',
    originPhone: 'origin_phone',
  }
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = map[key] ?? key
    result[snakeKey] = value
  }
  return result
}

/** Tables that have no updated_at column — never send it on write. */
const TABLES_WITHOUT_UPDATED_AT = new Set([
  'listing_reports',
  'job_reports',
  'event_reports',
  'subscriber_reports',
  'verification_requests',
  'personal_documents',
  'receipts',
  'wallet_entries',
  // Guard until 20260721180000_p2p_offers_orders_updated_at is applied everywhere.
  // Safe to keep: full offer/order state lives in payload / client store.
  'p2p_offers',
  'p2p_orders',
])

function receiptToRemoteRow(receipt) {
  if (!receipt?.id) return null
  return {
    id: receipt.id,
    userId: receipt.userId,
    relatedType: receipt.relatedType || '',
    relatedId: receipt.relatedId || '',
    title: receipt.title || '',
    amount: Number(receipt.amount) || 0,
    currency: receipt.currency || 'RUB',
    status: receipt.status || 'issued',
    details: receipt.details || {},
    simulation: receipt.simulation === true,
    createdAt: receipt.createdAt,
  }
}

function stripUnsupportedColumns(table, payload) {
  const next = { ...payload }
  if (TABLES_WITHOUT_UPDATED_AT.has(table)) {
    delete next.updated_at
  }
  return next
}

async function upsert(table, data) {
  let payload = stripUnsupportedColumns(table, toSnake(data))
  let { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' })
  // Legacy / migration lag: strip unknown columns and retry (parcels passport fields, etc.).
  for (let i = 0; i < 8 && error; i += 1) {
    const missing = (error.message || '').match(/Could not find the '([^']+)' column/i)?.[1]
    if (!missing || !(missing in payload)) break
    const { [missing]: _omit, ...rest } = payload
    payload = rest
    ;({ error } = await supabase.from(table).upsert(payload, { onConflict: 'id' }))
  }
  if (error) throw error
}

/** Upsert offre (si fournie) + commande via RPC — respecte la FK offer_id. */
async function syncP2pOrder(order, offer = null) {
  const { error } = await supabase.rpc('moxt_sync_p2p_order', {
    p_order: p2pOrderToRemoteRow(order),
    p_offer: offer ? p2pOfferToRemoteRow(offer) : null,
  })
  if (!error) return

  // Fallback si la migration RPC n'est pas encore appliquée.
  const missingRpc =
    error.code === 'PGRST202' ||
    /moxt_sync_p2p_order|Could not find the function/i.test(error.message || '')
  if (!missingRpc) throw error

  if (offer) {
    try {
      await upsert('p2p_offers', p2pOfferToRemoteRow(offer))
    } catch (offerError) {
      // RLS acheteur : l'upsert offre peut échouer si l'offre existe déjà — OK pour la FK.
      const isRls =
        offerError?.code === '42501' ||
        /row-level security|permission denied/i.test(offerError?.message || '')
      if (!isRls) throw offerError
    }
  }
  await upsert('p2p_orders', p2pOrderToRemoteRow(order))
}

async function insertRow(table, data) {
  const { error } = await supabase.from(table).insert(data)
  if (error) {
    if (error.code === '23505') return
    throw error
  }
}

async function syncActiveContentReport(state, slice, payload, foreignKey, table) {
  const reports = state?.[slice]?.reports || []
  const report = reports.find(
    (item) =>
      item[foreignKey] === payload[foreignKey] &&
      item.reporterId === payload.reporterId &&
      item.status === 'new',
  )
  if (!report) return
  const snakeKey =
    foreignKey === 'listingId' ? 'listing_id' : foreignKey === 'jobId' ? 'job_id' : 'event_id'
  await insertRow(table, reportToRemoteRow(report, snakeKey))
}

async function syncActiveSubscriberReport(state, payload) {
  const reports = state?.account?.subscriberReports || []
  const report = reports.find(
    (item) =>
      item.publisherType === payload.publisherType &&
      item.publisherId === payload.publisherId &&
      item.subscriberId === payload.subscriberId &&
      item.reporterId === payload.reporterId &&
      item.status === 'new',
  )
  if (!report) return
  await insertRow('subscriber_reports', subscriberReportToRemoteRow(report))
}

async function syncActiveDispute(state, payload) {
  const dispute = state?.disputes?.items?.find(
    (item) =>
      item.id === payload.id ||
      (item.reporterId === payload.reporterId &&
        item.relatedType === payload.relatedType &&
        item.relatedId === payload.relatedId &&
        !['resolved', 'closed'].includes(item.status)),
  )
  if (!dispute) return
  await insertRow('disputes', {
    id: dispute.id,
    opened_by: dispute.openedBy || dispute.reporterId,
    reporter_id: dispute.reporterId || dispute.openedBy,
    business_id: dispute.businessId || null,
    related_type: dispute.relatedType,
    related_id: dispute.relatedId,
    reason: dispute.reason,
    evidence: dispute.evidence || [],
    status: dispute.status,
    created_at: dispute.createdAt,
  })
}

async function update(table, id, fields) {
  const payload = stripUnsupportedColumns(table, { ...toSnake(fields) })
  if (!TABLES_WITHOUT_UPDATED_AT.has(table)) {
    payload.updated_at = new Date().toISOString()
  }
  const { error } = await supabase.from(table).update(payload).eq('id', id)
  if (error) throw error
}

/** Schema columns only — avoids PGRST204 from client-only / mismatched fields. */
function verificationRequestToRemoteRow(request) {
  return {
    id: request.id,
    user_id: request.userId,
    level: request.level || 'identity',
    document_ids: request.documentIds || [],
    note: request.note || '',
    status: request.status || 'pending_review',
    created_at: request.createdAt || new Date().toISOString(),
    ...(request.reviewedAt ? { reviewed_at: request.reviewedAt } : {}),
    ...(request.reviewedBy && String(request.reviewedBy).length === 36
      ? { reviewed_by: request.reviewedBy }
      : {}),
    ...(request.reviewNote !== undefined ? { review_note: request.reviewNote || '' } : {}),
  }
}

/** Schema columns only — prefer durable `storage_path`; `url` may hold a short-lived signed link. */
function personalDocumentToRemoteRow(doc) {
  const storagePath =
    doc.storagePath ||
    (typeof doc.url === 'string' && !doc.url.includes('://') ? doc.url : null) ||
    null
  const storageUrl = doc.url || doc.fileUrl || doc.publicUrl || null
  const row = {
    id: doc.id,
    user_id: doc.userId,
    category: doc.category || 'identity',
    name: doc.name || '',
    size: Number(doc.size) || 0,
    type: doc.type || 'application/octet-stream',
    url: storageUrl,
    status: doc.status || 'pending_review',
    created_at: doc.createdAt || new Date().toISOString(),
  }
  if (storagePath) row.storage_path = storagePath
  if (doc.deletedAt) row.deleted_at = doc.deletedAt
  if (doc.deletedByUser != null) row.deleted_by_user = Boolean(doc.deletedByUser)
  return row
}

async function syncConversationRow(state, conversationId) {
  const conversation = state.communications.conversations.find((c) => c.id === conversationId)
  if (!conversation) return
  await persistConversationRemote(conversation)
}

async function reconcileConversation(dispatch, conversation, remoteRow) {
  dispatch(
    replaceConversationId({
      fromId: conversation.id,
      conversation: normalizeConversation({
        ...fromRow(remoteRow),
        messages: conversation.messages || [],
        messagesLoaded: conversation.messagesLoaded ?? false,
      }),
    }),
  )
}

async function syncMessageRow(message, conversation, dispatch) {
  const canonicalId = await resolveCanonicalConversationId(conversation, ({ fromId, remoteRow }) => {
    if (fromId !== conversation.id) reconcileConversation(dispatch, conversation, remoteRow)
  })
  await persistMessageRemote(message, canonicalId)
}

// Retry avec backoff exponentiel — max 3 tentatives
async function withRetry(fn, maxAttempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt))
      }
    }
  }
  throw lastError
}

const markReadDebounceByConversation = new Map()
const MARK_READ_RPC_DEBOUNCE_MS = 400

async function persistMarkConversationRead(payload, state) {
  const conversation = state.communications.conversations.find(
    (c) => c.id === payload.conversationId,
  )
  if (!conversation) return

  const { error } = await supabase.rpc('moxt_mark_conversation_read', {
    p_conversation_id: payload.conversationId,
  })
  if (error) {
    console.warn('[Supabase] markConversationRead RPC:', error.message)
    try {
      await syncConversationRow(state, payload.conversationId)
    } catch (fallbackError) {
      console.warn('[Supabase] markConversationRead fallback:', fallbackError?.message)
    }
  }
}

function scheduleMarkConversationRead(payload, getState) {
  const conversationId = payload.conversationId
  const existing = markReadDebounceByConversation.get(conversationId)
  if (existing) clearTimeout(existing.timer)

  markReadDebounceByConversation.set(conversationId, {
    payload,
    timer: setTimeout(() => {
      markReadDebounceByConversation.delete(conversationId)
      void withRetry(() => persistMarkConversationRead(payload, getState()))
    }, MARK_READ_RPC_DEBOUNCE_MS),
  })
  return Promise.resolve()
}

// ─── Handlers par action ──────────────────────────────────────────────────────

const handlers = {
  // ── Marketplace ─────────────────────────────────────────────────────────────
  'marketplace/createListing': async (payload) => {
    await saveListingRemote(payload)
  },
  'marketplace/updateListingStatus': async (payload) => {
    await update('listings', payload.id, { status: payload.status })
  },
  'marketplace/updateListing': async (payload, state) => {
    const listing = state.marketplace.items.find((item) => item.id === payload.id)
    if (listing) await saveListingRemote(listing)
  },
  'marketplace/deleteListing': async (payload) => {
    const { error } = await supabase.from('listings').delete().eq('id', payload.id)
    if (error) throw error
  },
  'marketplace/addListingQuestion': async (payload) => {
    await upsert('listing_questions', {
      id: payload.question.id,
      listingId: payload.listingId,
      authorId: payload.question.authorId,
      authorName: payload.question.authorName,
      text: payload.question.text,
      answer: '',
      createdAt: payload.question.createdAt,
    })
  },
  'marketplace/answerListingQuestion': async (payload) => {
    await update('listing_questions', payload.questionId, {
      answer: payload.answer,
      answeredAt: payload.answeredAt,
    })
  },
  'marketplace/reportListing': async (payload, state) => {
    await syncActiveContentReport(state, 'marketplace', payload, 'listingId', 'listing_reports')
  },
  'marketplace/updateListingReportStatus': async (payload) => {
    await update('listing_reports', payload.id, { status: payload.status })
  },

  // ── Colis ────────────────────────────────────────────────────────────────────
  'parcels/createParcel': async (payload) => {
    const {
      originCountry: _oc,
      destinationCountry: _dc,
      travelProofName: _tpn,
      travelProofType: _tpt,
      travelProofSize: _tps,
      travelProofFile: _tpf,
      passportProofName: _ppn,
      passportProofType: _ppt,
      passportProofSize: _pps,
      passportProofFile: _ppf,
      ...parcelData
    } = payload
    const cleaned = {
      ...parcelData,
      maxWeightPerItem: parcelData.maxWeightPerItem !== '' ? parcelData.maxWeightPerItem : null,
      travelProofUrl: parcelData.travelProofUrl || null,
      passportProofUrl: parcelData.passportProofUrl || null,
      proofStatus: parcelData.proofStatus || (parcelData.travelProofUrl ? 'pending_review' : 'missing'),
      passportStatus:
        parcelData.passportStatus || (parcelData.passportProofUrl ? 'pending_review' : 'missing'),
      reservations: Array.isArray(parcelData.reservations) ? parcelData.reservations : [],
    }
    await upsert('parcels', cleaned)
  },
  'parcels/requestParcelReservation': async (payload) => {
    const { error } = await supabase
      .from('parcel_requests')
      .upsert(parcelRequestToRemoteRow(payload), { onConflict: 'id' })
    if (error) throw error
  },
  'parcels/updateParcelRequestStatus': async (payload, state) => {
    const request = state.parcels.requests.find((r) => r.id === payload.id)
    if (request) {
      await update('parcel_requests', payload.id, { status: payload.status })
      if (payload.status === 'approved') {
        const parcel = state.parcels.items.find((p) => p.id === request.parcelId)
        if (parcel) {
          await update('parcels', parcel.id, {
            remaining_kg: parcel.remainingKg,
            status: parcel.status,
            reservations: parcel.reservations,
          })
        }
      }
    }
  },
  'parcels/updateParcelProofStatus': async (payload) => {
    await update('parcels', payload.id, { proof_status: payload.status })
  },
  'parcels/updateParcelPassportStatus': async (payload) => {
    await update('parcels', payload.id, { passport_status: payload.status })
  },
  'parcels/updateParcelStatus': async (payload) => {
    await update('parcels', payload.id, { status: payload.status })
  },
  'parcels/updateParcel': async (payload, state) => {
    const parcel = state.parcels.items.find((item) => item.id === payload.id)
    if (!parcel) return
    const {
      travelProofName: _tpn,
      travelProofType: _tpt,
      travelProofSize: _tps,
      travelProofFile: _tpf,
      passportProofName: _ppn,
      passportProofType: _ppt,
      passportProofSize: _pps,
      passportProofFile: _ppf,
      originCountry: _oc,
      destinationCountry: _dc,
      ...parcelData
    } = parcel
    await upsert('parcels', {
      ...parcelData,
      maxWeightPerItem: parcelData.maxWeightPerItem !== '' ? parcelData.maxWeightPerItem : null,
      travelProofUrl: parcelData.travelProofUrl || null,
      passportProofUrl: parcelData.passportProofUrl || null,
      proofStatus: parcelData.proofStatus || (parcelData.travelProofUrl ? 'pending_review' : 'missing'),
      passportStatus:
        parcelData.passportStatus || (parcelData.passportProofUrl ? 'pending_review' : 'missing'),
      reservations: Array.isArray(parcelData.reservations) ? parcelData.reservations : [],
    })
  },
  'parcels/cancelParcelRequest': async (payload, state) => {
    await update('parcel_requests', payload.id, { status: 'cancelled' })
    const request = state.parcels.requests.find((item) => item.id === payload.id)
    if (request?.parcelId) {
      const parcel = state.parcels.items.find((item) => item.id === request.parcelId)
      if (parcel) {
        await update('parcels', parcel.id, {
          remaining_kg: parcel.remainingKg,
          status: parcel.status,
          reservations: parcel.reservations,
        })
      }
    }
  },
  'parcels/releaseParcelRequestByOwner': async (payload, state) => {
    const request = state.parcels.requests.find((item) => item.id === payload.id)
    if (request) {
      await update('parcel_requests', payload.id, { status: 'cancelled' })
      const parcel = state.parcels.items.find((item) => item.id === request.parcelId)
      if (parcel) {
        await update('parcels', parcel.id, {
          remaining_kg: parcel.remainingKg,
          status: parcel.status,
          reservations: parcel.reservations,
        })
      }
    }
  },
  'parcels/deleteParcel': async (payload) => {
    const { error } = await supabase.from('parcels').delete().eq('id', payload.id)
    if (error) throw error
  },

  // ── Compteurs de vues ─────────────────────────────────────────────────────
  // Incrément atomique côté serveur (RPC) : un simple update lu-puis-écrit
  // perdrait des vues concurrentes. Le RPC ignore aussi les vues de l'auteur.
  'marketplace/incrementListingView': async (payload) => {
    await supabase.rpc('moxt_increment_view', {
      p_entity_type: 'listing',
      p_entity_id: payload,
    })
  },
  'jobs/incrementJobView': async (payload) => {
    await supabase.rpc('moxt_increment_view', { p_entity_type: 'job', p_entity_id: payload })
  },
  'parcels/incrementParcelView': async (payload) => {
    await supabase.rpc('moxt_increment_view', { p_entity_type: 'parcel', p_entity_id: payload })
  },
  'events/incrementEventView': async (payload) => {
    await supabase.rpc('moxt_increment_view', { p_entity_type: 'event', p_entity_id: payload })
  },

  // ── Litiges ───────────────────────────────────────────────────────────────────
  'disputes/openDispute': async (payload, state) => {
    await syncActiveDispute(state, payload)
  },
  'disputes/updateDisputeStatus': async (payload, state) => {
    const dispute = state.disputes.items.find((item) => item.id === payload.id)
    if (dispute) {
      await update('disputes', dispute.id, {
        status: dispute.status,
        updatedAt: dispute.updatedAt,
        updatedBy: dispute.updatedBy,
      })
    }
  },

  // ── Jobs ─────────────────────────────────────────────────────────────────────
  'jobs/createJob': async (payload) => {
    await saveJobRemote(payload)
  },
  'jobs/applyToJob': async (payload) => {
    await saveJobApplicationRemote(payload)
  },
  'jobs/updateApplicationStatus': async (payload) => {
    await update('job_applications', payload.id, { status: payload.status })
  },
  'jobs/withdrawApplication': async (payload) => {
    await update('job_applications', payload.id, { status: 'withdrawn' })
  },
  'jobs/updateJob': async (payload, state) => {
    const job = state.jobs.items.find((item) => item.id === payload.id)
    if (job) await saveJobRemote(job)
  },
  'jobs/moderateJob': async (payload) => {
    await update('jobs', payload.id, { status: payload.status })
  },
  'jobs/deleteJob': async (payload) => {
    const { error } = await supabase.from('jobs').delete().eq('id', payload.id)
    if (error) throw error
  },
  'jobs/reportJob': async (payload, state) => {
    await syncActiveContentReport(state, 'jobs', payload, 'jobId', 'job_reports')
  },
  'jobs/updateJobReportStatus': async (payload) => {
    await update('job_reports', payload.id, { status: payload.status })
  },

  // ── Événements ───────────────────────────────────────────────────────────────
  'events/createEvent': async (payload) => {
    await upsert('events', payload)
  },
  'events/registerForEvent': async (payload) => {
    const { error } = await supabase
      .from('event_registrations')
      .upsert(eventRegistrationToRemoteRow(payload), { onConflict: 'id' })
    if (error) throw error
  },
  'events/updateRegistrationStatus': async (payload) => {
    await update('event_registrations', payload.id, { status: payload.status })
  },
  'events/updateEvent': async (payload, state) => {
    const event = state.events.items.find((item) => item.id === payload.id)
    if (event) await upsert('events', event)
  },
  'events/moderateEvent': async (payload) => {
    await update('events', payload.id, { status: payload.status })
  },
  'events/deleteEvent': async (payload) => {
    const { error } = await supabase.from('events').delete().eq('id', payload.id)
    if (error) throw error
  },
  'events/reportEvent': async (payload, state) => {
    await syncActiveContentReport(state, 'events', payload, 'eventId', 'event_reports')
  },
  'events/updateEventReportStatus': async (payload) => {
    await update('event_reports', payload.id, { status: payload.status })
  },
  'events/cancelRegistration': async (payload) => {
    await update('event_registrations', payload.id, { status: 'cancelled' })
  },

  // ── Entreprises ───────────────────────────────────────────────────────────────
  'businesses/saveBusiness': async (payload) => {
    await saveBusinessRemote(payload)
  },
  'businesses/deleteBusinessByUser': async (payload, getState) => {
    const business = getState().businesses.items.find((item) => item.id === payload.id)
    if (business) await saveBusinessRemote(business)
  },
  'businesses/addBusinessMember': async (payload) => {
    await upsertBusinessMemberRemote(payload)
  },
  'businesses/updateBusinessMember': async (payload, state) => {
    const member = state.businesses.members.find(
      (item) => item.id === payload.id && item.businessId === payload.businessId,
    )
    if (member) await upsertBusinessMemberRemote(member)
  },
  'businesses/removeBusinessMember': async (payload) => {
    const { error } = await supabase
      .from('business_members')
      .delete()
      .eq('id', payload.id)
      .eq('business_id', payload.businessId)
    if (error) throw error
  },
  'businesses/addBusinessDocument': async (payload, state) => {
    await upsertBusinessDocumentRemote(payload)
    const superseded = (state.businesses.documents || []).filter(
      (item) =>
        item.businessId === payload.businessId &&
        item.category === payload.category &&
        item.id !== payload.id &&
        (item.supersededAt || item.status === 'superseded'),
    )
    for (const doc of superseded) {
      await upsertBusinessDocumentRemote(doc)
    }
  },
  'businesses/updateBusinessDocumentStatus': async (payload, state) => {
    const document = state.businesses.documents.find((item) => item.id === payload.id)
    if (document) await upsertBusinessDocumentRemote(document)
  },
  'businesses/createBusinessRequest': async (payload) => {
    await upsertBusinessRequestRemote(payload)
  },
  'businesses/updateBusinessRequestStatus': async (payload, state) => {
    const request = state.businesses.requests.find(
      (item) => item.id === payload.id && item.businessId === payload.businessId,
    )
    if (request) await upsertBusinessRequestRemote(request)
  },
  'businesses/moderateBusiness': async (payload) => {
    await update('businesses', payload.id, { status: payload.status })
  },
  'businesses/setBusinessPinned': async (payload) => {
    // RPC plutôt qu'un update direct : la colonne ne doit pas être modifiable
    // par le propriétaire de l'entreprise, seulement par un admin.
    const { error } = await supabase.rpc('moxt_set_business_pinned', {
      p_business_id: payload.id,
      p_pinned: Boolean(payload.pinned),
    })
    if (error) throw error
  },
  'businesses/updateBusinessActivityVisibility': async (payload) => {
    await update('businesses', payload.businessId, {
      activity_visibility: payload.activityVisibility,
      updated_at: new Date().toISOString(),
    })
  },
  'businesses/updateBusinessStatus': async (payload) => {
    await update('businesses', payload.id, { status: payload.status })
  },

  // ── Messagerie ────────────────────────────────────────────────────────────────
  'communications/createConversation': async (payload) => {
    const { messages, messagesLoaded: _messagesLoaded, drafts: _drafts, ...conv } = payload
    const canonicalId = await persistConversationRemote(conv)
    if (messages?.length) {
      for (const msg of messages) {
        await persistMessageRemote(msg, canonicalId)
      }
    }
    return canonicalId
  },
  'communications/sendMessage': async (payload, state, dispatch) => {
    const conversation = state.communications.conversations.find(
      (c) => c.id === payload.conversationId,
    )
    if (!conversation) {
      throw new Error('Conversation introuvable.')
    }
    const senderId = String(payload.message?.senderId || payload.senderId || '')
    if ((conversation.blockedBy || []).map(String).includes(senderId)) {
      throw new Error('Conversation bloquée.')
    }

    const canonicalId = await persistMessageForConversation(
      payload.message,
      conversation,
      ({ remoteRow }) => reconcileConversation(dispatch, conversation, remoteRow),
    )

    const msg = payload.message
    const unreadBy =
      conversation.unreadBy && typeof conversation.unreadBy === 'object'
        ? { ...conversation.unreadBy }
        : {}
    const previewText = msg.text?.trim()
      ? msg.text
      : msg.attachment
        ? attachmentPreviewLabel(msg.attachment)
        : ''
    const conversationPatch = {
      updated_at: msg.createdAt,
      message_count: conversation.messageCount ?? null,
      unread_by: unreadBy,
      last_message_text: previewText,
      last_message_sender_id: msg.senderId,
      last_message_at: msg.createdAt,
    }
    if (conversation.relatedType === 'support' && Array.isArray(conversation.participantIds)) {
      conversationPatch.participant_ids = conversation.participantIds
    }
    await supabase.from('conversations').update(conversationPatch).eq('id', canonicalId)

    // Le trigger DB crée les lignes notifications ; on pousse ensuite vers les appareils.
    const muted = new Set((conversation.mutedBy || []).map(String))
    const blocked = new Set((conversation.blockedBy || []).map(String))
    const recipients = (conversation.participantIds || [])
      .map(String)
      .filter((id) => id && id !== senderId && !muted.has(id) && !blocked.has(id))
    if (recipients.length && msg.id) {
      const { dispatchPushNotification } = await import('../services/pushDispatch')
      for (const recipientId of recipients) {
        const notificationId = `msg_${msg.id}_${recipientId}`
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const result = await dispatchPushNotification(notificationId)
          if (result.ok) break
          // 404 / not_found = trigger pas encore prêt — retenter
          await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
        }
      }
    }
  },
  'communications/resendMessage': async (payload, state, dispatch) => {
    const conversation = state.communications.conversations.find(
      (c) => c.id === payload.conversationId,
    )
    const message = conversation?.messages.find((m) => m.id === payload.messageId)
    if (!conversation || !message) return
    try {
      await persistMessageForConversation(message, conversation, ({ remoteRow }) =>
        reconcileConversation(dispatch, conversation, remoteRow),
      )
      dispatch({
        type: 'communications/setMessagePending',
        payload: { conversationId: conversation.id, messageId: message.id, pending: false },
      })
    } catch (error) {
      dispatch({
        type: 'communications/setMessageSyncFailed',
        payload: { conversationId: conversation.id, messageId: message.id, failed: true },
      })
      throw error
    }
  },
  'communications/editMessage': async (payload, state, dispatch) => {
    const conversation = state.communications.conversations.find(
      (c) => c.id === payload.conversationId,
    )
    const message = conversation?.messages.find((m) => m.id === payload.messageId)
    if (!message || !conversation) return
    await syncMessageRow(message, conversation, dispatch)
    const previewText = message.text?.trim()
      ? message.text
      : message.attachment
        ? attachmentPreviewLabel(message.attachment)
        : conversation.lastMessageText
    if (conversation.messages[conversation.messages.length - 1]?.id === message.id) {
      await supabase
        .from('conversations')
        .update({
          last_message_text: previewText,
        })
        .eq('id', conversation.id)
    }
  },
  'communications/markConversationRead': async (payload, _state, _dispatch, _beforeState, getState) => {
    scheduleMarkConversationRead(payload, getState || (() => _state))
  },
  'communications/updateConversationContext': async (payload, state) => {
    await syncConversationRow(state, payload.id)
  },
  'communications/archiveConversation': async (payload, state) => {
    await syncConversationRow(state, payload.id)
  },
  'communications/restoreConversation': async (payload, state) => {
    await syncConversationRow(state, payload.id)
  },
  'communications/toggleConversationPin': async (payload, state) => {
    await syncConversationRow(state, payload.id)
  },
  'communications/toggleConversationMute': async (payload, state) => {
    await syncConversationRow(state, payload.id)
  },
  'communications/toggleConversationBlock': async (payload, state) => {
    await syncConversationRow(state, payload.id)
  },
  'communications/reactToMessage': async (payload, state, dispatch) => {
    const conversation = state.communications.conversations.find(
      (c) => c.id === payload.conversationId,
    )
    const message = conversation?.messages.find((m) => m.id === payload.messageId)
    if (message && conversation) {
      await syncMessageRow(message, conversation, dispatch)
    }
  },
  'communications/deleteMessageLocally': async (payload, state, dispatch) => {
    const conversation = state.communications.conversations.find(
      (c) => c.id === payload.conversationId,
    )
    const message = conversation?.messages.find((m) => m.id === payload.messageId)
    if (message && conversation) {
      await syncMessageRow(message, conversation, dispatch)
    }
  },

  // ── Transferts ────────────────────────────────────────────────────────────────
  'transfers/createTransfer': async (payload) => {
    if (payload.blocked) return
    let businessOwnerId = payload.businessOwnerId || null
    if (!businessOwnerId && payload.businessId) {
      const { data: businessRow } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', payload.businessId)
        .maybeSingle()
      businessOwnerId = businessRow?.owner_id || null
    }
    if (!businessOwnerId) {
      throw new Error(
        "Impossible de créer le transfert : propriétaire de l'entreprise introuvable. Réessayez ou choisissez un autre changeur.",
      )
    }
    const remotePayload = buildTransferRemotePayload(payload)
    try {
      await upsert('transfers', {
        id: payload.id,
        userId: payload.userId,
        originCountry: payload.originCountry,
        businessId: payload.businessId,
        businessOwnerId,
        status: payload.status,
        direction: payload.direction,
        amount: payload.amountSent,
        fee: payload.fees ?? payload.fee ?? 0,
        receivedAmount: payload.amountReceived,
        rate: payload.rate,
        rateDate: payload.rateDate,
        rateSource: payload.rateSource,
        sender: payload.sender,
        recipient: payload.recipient,
        exchanger: payload.exchanger,
        timeline: payload.timeline,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
        paymentDeadlineAt: payload.paymentDeadlineAt,
        payload: remotePayload,
      })
    } catch (error) {
      const message = String(error?.message || error || '')
      if (/could not find.*['"]payload['"].*transfers|payload.*transfers.*schema cache/i.test(message)) {
        throw new Error(
          "La colonne transfers.payload manque encore dans Supabase. Appliquez la migration Transferts, puis réessayez.",
          { cause: error },
        )
      }
      if (/acceptance_expires_at|acceptance_required|acceptance_requested_at|acceptance_resolved_at|previous_business_id/i.test(message)) {
        throw new Error(
          "Schéma transferts obsolète (colonnes d’acceptation). Les champs sont désormais dans payload — rechargez l’app après déploiement.",
          { cause: error },
        )
      }
      throw error
    }
    triggerEmail(payload.id, 'created').catch(() => {})
  },
  'transfers/declarePayment': async (payload, state) => {
    const transfer = state.transfers.items.find((t) => t.id === payload.id)
    if (transfer) {
      await update('transfers', transfer.id, {
        status: transfer.status,
        payment_proof: transfer.paymentProof,
        timeline: transfer.timeline,
      })
      triggerEmail(transfer.id, 'payment_declared').catch(() => {})
    }
  },
  'transfers/cancelTransfer': async (payload, state) => {
    const id = typeof payload === 'string' ? payload : payload?.id
    const transfer = state.transfers.items.find((t) => t.id === id)
    if (transfer) {
      await update('transfers', transfer.id, {
        status: transfer.status,
        timeline: transfer.timeline,
      })
      triggerEmail(transfer.id, 'cancelled').catch(() => {})
    }
  },
  'transfers/moderateTransfer': async (payload, state) => {
    const transfer = state.transfers.items.find((t) => t.id === payload.id)
    if (transfer) {
      await update('transfers', transfer.id, {
        status: transfer.status,
        business_proof: transfer.businessProof,
        timeline: transfer.timeline,
        updated_at: transfer.updatedAt,
      })
      if (transfer.status === 'completed') {
        triggerEmail(transfer.id, 'validated').catch(() => {})
      }
    }
  },
  'transfers/receiveTransfer': async (payload, state) => {
    const transfer = state.transfers.items.find((t) => t.id === payload.id)
    if (!transfer) return

    await update('transfers', transfer.id, {
      status: transfer.status,
      receivedAmount: transfer.receivedAmount,
      timeline: transfer.timeline,
      updatedAt: transfer.updatedAt,
      payload: buildTransferRemotePayload(transfer),
    })
  },
  'transfers/acceptTransferRequest': async (payload, state) => {
    const transfer = state.transfers.items.find((t) => t.id === payload.id)
    if (!transfer) return
    await update('transfers', transfer.id, {
      status: transfer.status,
      timeline: transfer.timeline,
      paymentDeadlineAt: transfer.paymentDeadlineAt,
      exchanger: transfer.exchanger,
      updatedAt: transfer.updatedAt,
      payload: buildTransferRemotePayload(transfer),
    })
  },
  'transfers/declineTransferRequest': async (payload, state) => {
    const transfer = state.transfers.items.find((t) => t.id === payload.id)
    if (!transfer) return
    await update('transfers', transfer.id, {
      status: transfer.status,
      timeline: transfer.timeline,
      updatedAt: transfer.updatedAt,
      payload: buildTransferRemotePayload(transfer),
    })
  },
  'transfers/reassignTransferExchanger': async (payload, state) => {
    const transfer = state.transfers.items.find((t) => t.id === payload.id)
    if (!transfer) return
    await update('transfers', transfer.id, {
      status: transfer.status,
      businessId: transfer.businessId,
      businessOwnerId: transfer.businessOwnerId,
      exchanger: transfer.exchanger,
      timeline: transfer.timeline,
      paymentDeadlineAt: transfer.paymentDeadlineAt,
      amount: transfer.amountSent,
      fee: transfer.fees ?? transfer.fee ?? 0,
      receivedAmount: transfer.amountReceived,
      rate: transfer.rate,
      rateDate: transfer.rateDate,
      rateSource: transfer.rateSource,
      updatedAt: transfer.updatedAt,
      payload: buildTransferRemotePayload(transfer),
    })
  },
  'transfers/expireOverdueTransfers': async (_payload, state, _dispatch, beforeState) => {
    const beforeItems = beforeState?.transfers?.items || []
    const afterItems = state.transfers.items || []
    const changed = afterItems.filter((transfer) => {
      const previous = beforeItems.find((item) => item.id === transfer.id)
      return previous && previous.status !== transfer.status
    })
    await Promise.all(
      changed.map((transfer) =>
        update('transfers', transfer.id, {
          status: transfer.status,
          timeline: transfer.timeline,
          updatedAt: transfer.updatedAt,
          payload: buildTransferRemotePayload(transfer),
        }),
      ),
    )
  },

  // ── P2P ───────────────────────────────────────────────────────────────────────
  'p2p/acceptOffer': async (payload, state) => {
    const offer = state.p2p.offers.find((item) => item.id === payload.offerId)
    if (!offer) {
      throw new Error(
        `Offre P2P introuvable (${payload.offerId}). Republiez l’offre puis réessayez.`,
      )
    }
    // RPC security definer : crée l'offre parente si absente (FK) puis la commande.
    // Contourne le RLS « own offers » qui empêche l'acheteur d'upsert l'offre.
    await syncP2pOrder(payload, { ...offer, status: 'accepted' })
  },
  'p2p/createOffer': async (payload) => {
    await upsert('p2p_offers', p2pOfferToRemoteRow(payload))
  },
  'p2p/updateOfferStatus': async (payload, state) => {
    const offer = state.p2p.offers.find((item) => item.id === payload.id)
    if (offer) await upsert('p2p_offers', p2pOfferToRemoteRow(offer))
  },
  'p2p/updateOffer': async (payload, state) => {
    const offer = state.p2p.offers.find((item) => item.id === payload.id)
    if (offer) await upsert('p2p_offers', p2pOfferToRemoteRow(offer))
  },
  'p2p/moderateOffer': async (payload, state) => {
    const offer = state.p2p.offers.find((item) => item.id === payload.id)
    if (offer) await upsert('p2p_offers', p2pOfferToRemoteRow(offer))
  },
  'p2p/deleteOffer': async (payload) => {
    const { error } = await supabase.from('p2p_offers').delete().eq('id', payload.id)
    if (error) throw error
  },
  'p2p/updateOrderStatus': async (payload, state) => {
    const order = state.p2p.orders.find((item) => item.id === payload.id)
    if (!order) return
    const offer = state.p2p.offers.find((item) => item.id === order.offerId)
    await syncP2pOrder(order, offer || null)
  },
  'p2p/updateOrderReceiveDetails': async (payload, state) => {
    const order = state.p2p.orders.find((item) => item.id === payload.id)
    if (!order) return
    const offer = state.p2p.offers.find((item) => item.id === order.offerId)
    await syncP2pOrder(order, offer || null)
  },
  'p2p/expireOrder': async (payload, state) => {
    const order = state.p2p.orders.find((item) => item.id === payload.id)
    if (!order) return
    const offer = state.p2p.offers.find((item) => item.id === order.offerId)
    await syncP2pOrder(order, offer || null)
  },
  'p2p/moderateOrder': async (payload, state) => {
    const order = state.p2p.orders.find((item) => item.id === payload.id)
    if (!order) return
    const offer = state.p2p.offers.find((item) => item.id === order.offerId)
    await syncP2pOrder(order, offer || null)
  },
  'p2p/addOrderProof': async (payload, state) => {
    const order = state.p2p.orders.find((item) => item.id === payload.id)
    if (!order) return
    const offer = state.p2p.offers.find((item) => item.id === order.offerId)
    await syncP2pOrder(order, offer || null)
  },
  'p2p/rateOrder': async (payload, state) => {
    const order = state.p2p.orders.find((item) => item.id === payload.id)
    if (!order) return
    const offer = state.p2p.offers.find((item) => item.id === order.offerId)
    await syncP2pOrder(order, offer || null)
  },

  // ── Notifications ─────────────────────────────────────────────────────────────
  // Les messages sont notifiés côté serveur (trigger messages_notify_recipients)
  // pour contourner le RLS et garantir le push même hors ligne.
  'communications/addNotification': async (payload, state) => {
    const currentUser = state.auth.user
    if (!currentUser || payload.userId === currentUser.id || payload.type === 'message') return
    // SECURITY DEFINER RPC: peer inserts bypass "own notifications only" RLS.
    // Soft-fail: une notif manquée ne doit jamais bloquer le flux métier / toast spam.
    const { error } = await supabase.rpc('moxt_create_notification', {
      p_id: payload.id,
      p_user_id: payload.userId,
      p_title: payload.title,
      p_message: payload.message,
      p_type: payload.type || 'system',
      p_link: payload.link || null,
      p_priority: payload.priority || 'normal',
    })
    if (error) {
      console.warn('[Supabase] notification:', error.message)
      return
    }

    const { dispatchPushNotification } = await import('../services/pushDispatch')
    void dispatchPushNotification(payload.id)
  },
  'communications/markNotificationRead': async (payload) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', payload)
    if (error) throw error
  },
  'communications/markAllNotificationsRead': async (userId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    if (error) throw error
  },
  'communications/archiveNotification': async (payload) => {
    const { error } = await supabase
      .from('notifications')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', payload.id)
      .eq('user_id', payload.userId)
    if (error) throw error
  },

  // ── Posts / Fil d'actualité ───────────────────────────────────────────────────
  'posts/createPost': async (payload) => {
    const images = Array.isArray(payload.images)
      ? payload.images.filter((url) => typeof url === 'string' && url).slice(0, 4)
      : payload.imageUrl
        ? [payload.imageUrl]
        : []
    const row = {
      id: payload.id,
      author_id: payload.authorId,
      author_name: payload.authorName,
      author_avatar_url: payload.authorAvatarUrl || null,
      source_type: payload.sourceType || 'free',
      source_id: payload.sourceId || null,
      message: payload.message,
      image_url: images[0] || payload.imageUrl || null,
      images,
      direct_link: payload.directLink || null,
      language: payload.language || null,
      pinned: payload.pinned === true,
      // jsonb columns: send arrays, never JSON.stringify (stores a scalar string → RPC breaks)
      likes: Array.isArray(payload.likes) ? payload.likes : [],
      comments: Array.isArray(payload.comments) ? payload.comments : [],
      last_shared_at: payload.lastSharedAt || payload.createdAt,
      status: payload.status || 'published',
      created_at: payload.createdAt,
      updated_at: payload.updatedAt,
    }
    let { error } = await supabase.from('posts').insert(row)
    if (error && /images/i.test(error.message || '')) {
      const { images: _images, ...legacyRow } = row
      ;({ error } = await supabase.from('posts').insert(legacyRow))
    }
    if (error) throw error
  },
  'posts/updatePost': async (payload) => {
    const fields = {}
    if (payload.message !== undefined) fields.message = payload.message
    if (payload.images !== undefined) {
      const images = Array.isArray(payload.images)
        ? payload.images.filter((url) => typeof url === 'string' && url).slice(0, 4)
        : []
      fields.images = images
      fields.image_url = images[0] || null
    } else if (payload.imageUrl !== undefined) {
      fields.image_url = payload.imageUrl
      fields.images = payload.imageUrl ? [payload.imageUrl] : []
    }
    if (payload.status !== undefined) fields.status = payload.status
    if (payload.pinned !== undefined) fields.pinned = payload.pinned === true
    fields.updated_at = payload.updatedAt || new Date().toISOString()
    let { error } = await supabase.from('posts').update(fields).eq('id', payload.id)
    if (error && /images/i.test(error.message || '') && 'images' in fields) {
      const { images: _images, ...legacyFields } = fields
      ;({ error } = await supabase.from('posts').update(legacyFields).eq('id', payload.id))
    }
    if (error) throw error
  },
  'posts/setPostPinned': async (payload, state) => {
    const post = state.posts?.items?.find((item) => item.id === payload.id)
    const { error } = await supabase
      .from('posts')
      .update({
        pinned: payload.pinned === true,
        updated_at: post?.updatedAt || new Date().toISOString(),
      })
      .eq('id', payload.id)
    if (error) throw error
  },
  'posts/moderatePost': async (payload) => {
    const { error } = await supabase
      .from('posts')
      .update({
        status: payload.status,
        updated_at: payload.updatedAt || new Date().toISOString(),
      })
      .eq('id', payload.id)
    if (error) throw error
  },
  'posts/deletePost': async (payload) => {
    const { error } = await supabase.from('posts').delete().eq('id', payload)
    if (error) throw error
  },
  'posts/toggleLike': async (payload) => {
    const { error } = await supabase.rpc('moxt_post_toggle_like', {
      p_post_id: payload.postId,
    })
    if (error) throw error
  },
  'posts/addComment': async (payload) => {
    const { error } = await supabase.rpc('moxt_post_add_comment', {
      p_post_id: payload.postId,
      p_comment: payload.comment,
    })
    if (error) throw error
  },
  // ── Statuts éphémères (7 jours) ─────────────────────────────────────────────
  'statuses/createStatus': async (payload) => {
    const row = {
      id: payload.id,
      author_id: payload.authorId,
      author_name: payload.authorName,
      author_avatar_url: payload.authorAvatarUrl || null,
      business_id: payload.businessId || null,
      images: payload.images || [],
      caption: payload.caption || '',
      is_official: payload.isOfficial === true,
      viewed_by: payload.viewedBy ?? [],
      viewers: {},
      reactions: {},
      created_at: payload.createdAt,
      expires_at: payload.expiresAt,
    }
    const { error } = await supabase.from('statuses').insert(row)
    if (error) throw error
  },
  'statuses/markStatusViewed': async (payload) => {
    // RPC security definer : no-op serveur si déjà vu (1re date figée).
    const { error } = await supabase.rpc('moxt_status_mark_viewed', {
      p_status_id: payload.statusId,
      p_user_name: payload.userName || '',
      p_user_avatar_url: payload.userAvatarUrl || null,
    })
    if (error) throw error
  },
  'statuses/reactToStatus': async (payload) => {
    const { error } = await supabase.rpc('moxt_status_react', {
      p_status_id: payload.statusId,
      p_image_key: payload.imageKey,
      p_emoji: payload.emoji || null,
    })
    if (error) throw error
  },
  'statuses/removeStatusImage': async (payload, state) => {
    const status = state.statuses?.items?.find((item) => item.id === payload.statusId)
    if (!status) return
    if (!status.images.length) {
      const { error } = await supabase.from('statuses').delete().eq('id', payload.statusId)
      if (error) throw error
      return
    }
    const { error } = await supabase
      .from('statuses')
      .update({
        images: status.images,
        reactions: status.reactions ?? {},
      })
      .eq('id', payload.statusId)
    if (error) throw error
  },
  'statuses/deleteStatus': async (payload) => {
    const { error } = await supabase.from('statuses').delete().eq('id', payload)
    if (error) throw error
  },

  // ── Guide d'aide (étudiants / étrangers en Russie) ─────────────────────────────
  'helpArticles/createHelpArticle': async (payload) => {
    const baseRow = {
      id: payload.id,
      translation_group_id: payload.translationGroupId,
      category: payload.category,
      language: payload.language,
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
      source_name: payload.sourceName || null,
      source_url: payload.sourceUrl || null,
      verified_at: payload.verifiedAt || null,
      pinned: payload.pinned === true,
      status: payload.status || 'published',
      author_id: payload.authorId,
      author_name: payload.authorName || '',
      images: Array.isArray(payload.images) ? payload.images : [],
      created_at: payload.createdAt,
      updated_at: payload.updatedAt,
    }
    const withSort = {
      ...baseRow,
      ...(Number.isFinite(payload.sortOrder) ? { sort_order: payload.sortOrder } : {}),
    }
    const { error } = await supabase.from('help_articles').insert(withSort)
    if (!error) return
    if (String(error.message || '').toLowerCase().includes('sort_order')) {
      const { error: retryError } = await supabase.from('help_articles').insert(baseRow)
      if (retryError) throw retryError
      return
    }
    throw error
  },
  'helpArticles/updateHelpArticle': async (payload, state) => {
    const article = state.helpArticles?.items?.find((item) => item.id === payload.id)
    if (!article) return
    const { error } = await supabase
      .from('help_articles')
      .update({
        category: article.category,
        language: article.language,
        title: article.title,
        summary: article.summary,
        content: article.content,
        source_name: article.sourceName || null,
        source_url: article.sourceUrl || null,
        verified_at: article.verifiedAt || null,
        pinned: article.pinned === true,
        status: article.status || 'published',
        images: Array.isArray(article.images) ? article.images : [],
        ...(Number.isFinite(article.sortOrder) ? { sort_order: article.sortOrder } : {}),
        updated_at: article.updatedAt,
      })
      .eq('id', payload.id)
    if (error) {
      // Colonne absente tant que la migration n’est pas appliquée : réessayer sans sort_order.
      const message = String(error.message || '').toLowerCase()
      if (message.includes('sort_order')) {
        const { error: retryError } = await supabase
          .from('help_articles')
          .update({
            category: article.category,
            language: article.language,
            title: article.title,
            summary: article.summary,
            content: article.content,
            source_name: article.sourceName || null,
            source_url: article.sourceUrl || null,
            verified_at: article.verifiedAt || null,
            pinned: article.pinned === true,
            status: article.status || 'published',
            updated_at: article.updatedAt,
          })
          .eq('id', payload.id)
        if (retryError) throw retryError
        return
      }
      throw error
    }
  },
  'helpArticles/deleteHelpArticle': async (payload) => {
    const { error } = await supabase.from('help_articles').delete().eq('id', payload)
    if (error) throw error
  },

  'posts/deleteComment': async (payload, state) => {
    const postId = payload?.postId
    const commentId = typeof payload?.commentId === 'string' ? payload.commentId.trim() : ''
    if (!postId) throw new Error('Publication introuvable')

    // Les ids `legacy-…` n'existent pas en base (normalisation locale au chargement).
    const canUseDeleteRpc = commentId && !commentId.startsWith('legacy-')

    if (canUseDeleteRpc) {
      const { error } = await supabase.rpc('moxt_post_delete_comment', {
        p_post_id: postId,
        p_comment_id: commentId,
      })
      if (!error) return
      const msg = String(error.message || '')
      // Fallback si RPC absente / comments stockés en string jsonb
      if (!/schema cache|could not find the function|pgrst202|extract elements from a scalar|22023/i.test(msg)) {
        throw error
      }
    }

    const post = state.posts?.items?.find((item) => item.id === postId)
    const comments = Array.isArray(post?.comments)
      ? post.comments.filter((item) => item && typeof item === 'object')
      : []
    const { error: setError } = await supabase.rpc('moxt_post_set_comments', {
      p_post_id: postId,
      p_comments: comments,
    })
    if (setError) {
      // Dernier recours : UPDATE direct (auteur / modo seulement via RLS)
      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments, updated_at: new Date().toISOString() })
        .eq('id', postId)
      if (updateError) throw setError
    }
  },

  // ── Favoris ───────────────────────────────────────────────────────────────────
  'account/upsertPublisherSubscription': async (payload) => {
    // Contrainte unique (subscriber_id, publisher_type, publisher_id) — pas seulement id.
    // Un nouvel id local sur une abo déjà sync → 23505 « Synchronisation impossible ».
    const { data: existing, error: lookupError } = await supabase
      .from('publisher_subscriptions')
      .select('id, created_at')
      .eq('subscriber_id', payload.userId)
      .eq('publisher_type', payload.publisherType)
      .eq('publisher_id', payload.publisherId)
      .maybeSingle()
    if (lookupError) throw lookupError

    await upsert('publisher_subscriptions', {
      id: existing?.id || payload.id,
      subscriber_id: payload.userId,
      publisher_type: payload.publisherType,
      publisher_id: payload.publisherId,
      notify_pref: payload.notifyPref,
      publisher_name: payload.publisherName,
      publisher_path: payload.publisherPath,
      created_at: existing?.created_at || payload.createdAt,
      updated_at: payload.updatedAt,
    })
  },
  'account/updatePublisherSubscriptionPref': async (payload, state) => {
    const subscription = (state.account.subscriptions || []).find(
      (item) =>
        item.userId === payload.userId &&
        item.publisherType === payload.publisherType &&
        item.publisherId === payload.publisherId,
    )
    if (!subscription) return
    const { data: existing, error: lookupError } = await supabase
      .from('publisher_subscriptions')
      .select('id, created_at')
      .eq('subscriber_id', subscription.userId)
      .eq('publisher_type', subscription.publisherType)
      .eq('publisher_id', subscription.publisherId)
      .maybeSingle()
    if (lookupError) throw lookupError

    await upsert('publisher_subscriptions', {
      id: existing?.id || subscription.id,
      subscriber_id: subscription.userId,
      publisher_type: subscription.publisherType,
      publisher_id: subscription.publisherId,
      notify_pref: subscription.notifyPref,
      publisher_name: subscription.publisherName,
      publisher_path: subscription.publisherPath,
      created_at: existing?.created_at || subscription.createdAt,
      updated_at: subscription.updatedAt,
    })
  },
  'account/removePublisherSubscription': async (payload) => {
    const { error } = await supabase
      .from('publisher_subscriptions')
      .delete()
      .eq('subscriber_id', payload.userId)
      .eq('publisher_type', payload.publisherType)
      .eq('publisher_id', payload.publisherId)
    if (error) throw error
  },
  'account/removeSubscriberByPublisher': async (payload) => {
    const { error } = await supabase
      .from('publisher_subscriptions')
      .delete()
      .eq('subscriber_id', payload.subscriberId)
      .eq('publisher_type', payload.publisherType)
      .eq('publisher_id', payload.publisherId)
    if (error) throw error
  },
  'account/banPublisherSubscriber': async (payload) => {
    await upsert('publisher_subscriber_bans', subscriberBanToRemoteRow(payload))
    const { error } = await supabase
      .from('publisher_subscriptions')
      .delete()
      .eq('subscriber_id', payload.subscriberId)
      .eq('publisher_type', payload.publisherType)
      .eq('publisher_id', payload.publisherId)
    if (error) throw error
  },
  'account/unbanPublisherSubscriber': async (payload) => {
    const { error } = await supabase
      .from('publisher_subscriber_bans')
      .delete()
      .eq('id', payload.id)
    if (error) throw error
  },
  'account/reportPublisherSubscriber': async (payload, state) => {
    await syncActiveSubscriberReport(state, payload)
  },
  'account/updateSubscriberReportStatus': async (payload) => {
    await update('subscriber_reports', payload.id, { status: payload.status })
  },
  'account/toggleAccountFavorite': async (payload, state) => {
    // La session Supabase peut ne pas encore être hydratée/rafraîchie au moment
    // du clic (juste après connexion, ou token expiré) : auth.uid() renvoie alors
    // null côté serveur et l'insert viole la policy RLS "user_id = auth.uid()".
    // On s'assure d'avoir une session valide pour CET utilisateur avant d'écrire.
    let {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user?.id !== payload.userId) {
      ;({
        data: { session },
      } = await supabase.auth.refreshSession())
    }
    if (session?.user?.id !== payload.userId) {
      console.warn(
        '[Supabase] account/toggleAccountFavorite ignoré — session non synchronisée avec cet utilisateur.',
      )
      return
    }

    const match = (f) =>
      f.relatedId === payload.relatedId &&
      f.relatedType === payload.relatedType &&
      f.userId === payload.userId
    const fav = state.account.favorites.find(match)
    if (fav) {
      const { snapshot: _snapshot, ...remoteFav } = fav
      await upsert('favorites', remoteFav)
    } else {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', payload.userId)
        .eq('related_type', payload.relatedType)
        .eq('related_id', payload.relatedId)
    }
  },
  'account/saveTransferProfile': async (payload) => {
    await upsert('transfer_profiles', payload)
  },
  'account/removeTransferProfile': async (payload) => {
    const { error } = await supabase
      .from('transfer_profiles')
      .delete()
      .eq('id', payload.id)
      .eq('user_id', payload.userId)
    if (error) throw error
  },
  'account/addPersonalDocument': async (payload, state) => {
    const { error } = await supabase
      .from('personal_documents')
      .upsert(personalDocumentToRemoteRow(payload), { onConflict: 'id' })
    if (error) throw error
    const replaced = (state.account.documents || []).filter(
      (item) =>
        item.userId === payload.userId &&
        item.category === payload.category &&
        item.id !== payload.id &&
        item.deletedAt &&
        !item.deletedByUser,
    )
    for (const doc of replaced) {
      const { error: replaceError } = await supabase
        .from('personal_documents')
        .upsert(personalDocumentToRemoteRow(doc), { onConflict: 'id' })
      if (replaceError) throw replaceError
    }
  },
  'account/removePersonalDocument': async (payload) => {
    await update('personal_documents', payload.id, {
      deletedAt: new Date().toISOString(),
      deletedByUser: true,
    })
  },
  'account/submitVerificationRequest': async (payload, state) => {
    // Reducer reuses the pending row id locally; prefer that so re-submit updates the same row.
    const request =
      state.account.verificationRequests.find(
        (item) => item.userId === payload.userId && item.status === 'pending_review',
      ) || payload
    const documentIds =
      (Array.isArray(payload.documentIds) && payload.documentIds.length
        ? payload.documentIds
        : null) ||
      request.documentIds ||
      []
    const row = verificationRequestToRemoteRow({
      ...payload,
      ...request,
      documentIds,
      id: request.id || payload.id,
    })

    // Prefer insert (matches insert-only RLS). Avoid blind upsert: PostgREST upsert
    // requires an UPDATE policy even when the row is new.
    const { error: insertError } = await supabase.from('verification_requests').insert(row)
    if (!insertError) return

    if (insertError.code === '23505') {
      const { error: updateError } = await supabase
        .from('verification_requests')
        .update({
          level: row.level,
          document_ids: row.document_ids,
          note: row.note,
          status: row.status,
        })
        .eq('id', row.id)
        .eq('user_id', row.user_id)
      if (!updateError) return

      // Without UPDATE RLS yet: fall back to inserting the prepare() id as a new row.
      if (payload.id && payload.id !== row.id) {
        const { error: fallbackError } = await supabase.from('verification_requests').insert({
          ...row,
          id: payload.id,
          created_at: payload.createdAt || row.created_at,
        })
        if (!fallbackError) return
        throw updateError
      }
      throw updateError
    }

    throw insertError
  },
  'account/updateVerificationStatus': async (payload, state) => {
    const request = state.account.verificationRequests.find((item) => item.id === payload.id)
    if (request) {
      const patch = {
        status: request.status,
        reviewedAt: request.reviewedAt,
      }
      if (request.reviewedBy && String(request.reviewedBy).length === 36) {
        patch.reviewedBy = request.reviewedBy
      }
      if (request.reviewNote !== undefined) {
        patch.reviewNote = request.reviewNote || ''
      }
      await update('verification_requests', request.id, patch)
      if (request.status === 'verified' && request.userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'verified', updated_at: new Date().toISOString() })
          .eq('id', request.userId)
        if (error) throw error

        // Propager verified aux personal_documents liés à la demande.
        const documentIds = Array.isArray(request.documentIds)
          ? request.documentIds.map(String).filter(Boolean)
          : []
        if (documentIds.length) {
          const { error: docsError } = await supabase
            .from('personal_documents')
            .update({ status: 'verified' })
            .in('id', documentIds)
            .eq('user_id', request.userId)
            .is('deleted_at', null)
          if (docsError) console.warn('[Supabase] personal docs verify:', docsError.message)
        } else {
          const { error: docsError } = await supabase
            .from('personal_documents')
            .update({ status: 'verified' })
            .eq('user_id', request.userId)
            .is('deleted_at', null)
            .in('status', ['pending_review', 'pending'])
            .in('category', ['identity', 'address', 'selfie', 'passport'])
          if (docsError) console.warn('[Supabase] personal docs verify fallback:', docsError.message)
        }
      }
    }
  },
  'account/submitPhoneAssistRequest': async (payload, state) => {
    const pending =
      (state.account.phoneAssistRequests || []).find(
        (item) => item.userId === payload.userId && item.status === 'pending',
      ) || payload
    const row = {
      id: pending.id || payload.id,
      user_id: payload.userId,
      phone: payload.phone || pending.phone || '',
      note: payload.note || pending.note || '',
      status: 'pending',
      created_at: pending.createdAt || payload.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { error: insertError } = await supabase.from('phone_assist_requests').insert(row)
    if (!insertError) return
    if (insertError.code === '23505') {
      const { error: updateError } = await supabase
        .from('phone_assist_requests')
        .update({
          phone: row.phone,
          note: row.note,
          status: 'pending',
          updated_at: row.updated_at,
        })
        .eq('user_id', row.user_id)
        .eq('status', 'pending')
      if (!updateError) return
      throw updateError
    }
    throw insertError
  },
  'account/updatePhoneAssistStatus': async (payload, state) => {
    const request = (state.account.phoneAssistRequests || []).find((item) => item.id === payload.id)
    if (!request) return
    const patch = {
      status: request.status,
      reviewed_at: request.reviewedAt || new Date().toISOString(),
      review_note: request.reviewNote || '',
      updated_at: new Date().toISOString(),
    }
    if (request.reviewedBy && String(request.reviewedBy).length === 36) {
      patch.reviewed_by = request.reviewedBy
    }
    const { error } = await supabase.from('phone_assist_requests').update(patch).eq('id', request.id)
    if (error) throw error
  },
  'account/updateAccountPreferences': async (payload, state) => {
    const mergedPreferences = {
      ...selectAccountPreferences(state, payload.userId),
      ...payload.preferences,
    }
    const updates = {
      updated_at: new Date().toISOString(),
      preferences: mergedPreferences,
    }
    if (payload.preferences?.activityVisibility) {
      updates.activity_visibility = payload.preferences.activityVisibility
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', payload.userId)
    if (error) throw error
  },
  'account/requestAccountDeletion': async (payload) => {
    await authService.requestAccountDeletion(payload.userId, payload.id)
  },
  'account/cancelAccountDeletion': async (payload) => {
    await authService.cancelAccountDeletion(payload)
    return payload
  },
  'administration/updateUserRole': async (payload, _state) => {
    const privileged = payload.role === 'admin' || payload.role === 'superadmin'
    // Privileged promotions are persisted in promoteAdminUtils (edge) before Redux updates.
    if (privileged) {
      if (payload.remoteSynced) return
      throw new Error('Promotion admin : synchronisation distante requise.')
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: payload.role, updated_at: new Date().toISOString() })
      .eq('id', payload.id)
    if (error) throw error
  },
  'administration/updateUserStatus': async (payload) => {
    const allowed = ['active', 'suspended', 'pending_deletion']
    const profileStatus = allowed.includes(payload.status) ? payload.status : 'active'
    const { error } = await supabase
      .from('profiles')
      .update({ status: profileStatus, updated_at: new Date().toISOString() })
      .eq('id', payload.id)
    if (error) throw error
  },
  'administration/purgeUserAccount': async (payload, state) => {
    const actor = state.auth?.user
    if (!actor || !['admin', 'superadmin'].includes(actor.role)) {
      throw new Error('Accès refusé.')
    }
    if (payload.id === actor.id) {
      throw new Error('Vous ne pouvez pas supprimer votre propre compte depuis l’administration.')
    }
    const target = state.administration?.users?.find((item) => item.id === payload.id)
    if (target?.role === 'superadmin') {
      throw new Error('Impossible de supprimer un superadmin.')
    }
    const { error } = await supabase.rpc('moxt_purge_user_account', { p_user_id: payload.id })
    if (error) throw error
  },
  'administration/updateUserOriginCountry': async (payload) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        origin_country: payload.originCountry,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.id)
    if (error) throw error
  },
  'administration/updateUserCity': async (payload) => {
    const city = String(payload.city || '').trim()
    if (!city) return
    const { error } = await supabase
      .from('profiles')
      .update({
        city,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.id)
    if (error) throw error
  },

  // ── Adresses destinataires ────────────────────────────────────────────────────
  'recipientAddresses/addRecipientAddress': async (payload) => {
    await upsert('recipient_addresses', payload)
  },
  'recipientAddresses/updateRecipientAddress': async (payload) => {
    await upsert('recipient_addresses', payload)
  },
  'recipientAddresses/removeRecipientAddress': async (payload) => {
    const { error } = await supabase.from('recipient_addresses').delete().eq('id', payload)
    if (error) throw error
  },

  // ── Support ───────────────────────────────────────────────────────────────────
  'communications/createSupportTicket': async (payload) => {
    const row = {
      id: payload.id,
      user_id: payload.userId,
      user_name: payload.userName,
      subject: payload.subject,
      priority: payload.priority,
      category: payload.category || 'question',
      status: payload.status,
      messages: payload.messages,
      created_at: payload.createdAt,
      updated_at: payload.updatedAt,
    }
    let attempt = { ...row }
    let { error } = await supabase.from('support_tickets').insert(attempt)
    // Legacy DBs may miss columns until migration is applied — strip and retry.
    for (let i = 0; i < 8 && error; i += 1) {
      const missing = (error.message || '').match(/Could not find the '([^']+)' column/i)?.[1]
      if (!missing || !(missing in attempt)) break
      const { [missing]: _omit, ...rest } = attempt
      attempt = rest
      ;({ error } = await supabase.from('support_tickets').insert(attempt))
    }
    if (error) {
      // Ticket is optional for admin chat; do not block conversation sync.
      console.warn('[Supabase] createSupportTicket skipped:', error.message)
    }
  },
  'communications/replySupportTicket': async (payload, state) => {
    const ticket = state.communications.support.find((item) => item.id === payload.ticketId)
    if (ticket) {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          messages: ticket.messages,
          status: ticket.status,
          updated_at: ticket.updatedAt,
        })
        .eq('id', ticket.id)
      if (error) {
        console.warn('[Supabase] replySupportTicket skipped:', error.message)
      }
    }
  },
  'communications/updateSupportStatus': async (payload, state) => {
    const ticket = state.communications.support.find((item) => item.id === payload.id)
    if (ticket) {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: ticket.status,
          updated_at: ticket.updatedAt,
        })
        .eq('id', ticket.id)
      if (error) throw error
    }
  },

  // ── Finance ───────────────────────────────────────────────────────────────────
  'finance/createSimulatedPayment': async (payload) => {
    await upsert('payments', payload)
  },
  'finance/updateSimulatedPaymentStatus': async (payload, state) => {
    const payment = state.finance.payments.find((item) => item.id === payload.id)
    if (payment) {
      await update('payments', payment.id, {
        status: payment.status,
        updatedAt: payment.updatedAt,
      })
    }
  },
  'finance/addWalletEntry': async (payload) => {
    await upsert('wallet_entries', payload)
  },
  'finance/createReceipt': async (payload) => {
    const row = receiptToRemoteRow(payload)
    if (row) await upsert('receipts', row)
  },
  'finance/upsertTransferReceipt': async (payload, state) => {
    const receipt =
      state.finance.receipts.find(
        (item) =>
          item.userId === payload.userId &&
          item.relatedType === payload.relatedType &&
          item.relatedId === payload.relatedId,
      ) || null
    const row = receiptToRemoteRow(receipt)
    if (row) await upsert('receipts', row)
  },

  // ── Entreprises (compléments) ─────────────────────────────────────────────────
  'businesses/updateBusinessTransferAccounts': async (payload, state) => {
    const business = state.businesses.items.find(
      (item) => item.id === payload.businessId && item.ownerId === payload.ownerId,
    )
    if (business) {
      await update('businesses', business.id, {
        transferAccounts: business.transferAccounts,
        updatedAt: business.updatedAt,
      })
    }
  },
  'businesses/updateBusinessTransferPricing': async (payload, state) => {
    const isStaff = ['admin', 'superadmin', 'moderator'].includes(payload.actorRole)
    const business = state.businesses.items.find(
      (item) =>
        item.id === payload.businessId && (isStaff || item.ownerId === payload.ownerId),
    )
    if (business) await saveBusinessRemote(business)
  },

  // ── Avis ──────────────────────────────────────────────────────────────────────
  'reviews/createReview': async (payload, state, dispatch) => {
    const review =
      state.reviews.items.find((item) => item.id === payload.id) ||
      state.reviews.items.find(
        (item) =>
          item.authorId === payload.authorId &&
          item.targetType === payload.targetType &&
          item.targetId === payload.targetId,
      ) ||
      payload
    const canonicalId = await syncReviewRemote(review)
    if (canonicalId && canonicalId !== review.id) {
      dispatch({
        type: 'reviews/reconcileReviewId',
        payload: { localId: review.id, remoteId: canonicalId },
      })
    }
  },
  'reviews/replyToReview': async (payload, state) => {
    const review = state.reviews.items.find((item) => item.id === payload.id)
    if (review) await syncReviewOwnerRemote(review)
  },
  'reviews/contestReview': async (payload, state) => {
    const review = state.reviews.items.find((item) => item.id === payload.id)
    if (review) await syncReviewOwnerRemote(review)
  },
  'reviews/deleteReview': async (payload, _state, _dispatch, beforeState) => {
    const review = beforeState.reviews.items.find((item) => item.id === payload)
    await deleteReviewRemote(payload, review)
  },
  'reviews/moderateReview': async (payload, state) => {
    const review = state.reviews.items.find((item) => item.id === payload.id)
    if (review) {
      const moderatorId = state.auth.user?.id
      const moderatedBy =
        moderatorId && String(moderatorId).length === 36 ? moderatorId : null
      await update('reviews', review.id, {
        status: review.status,
        moderatedAt: review.moderatedAt,
        moderatedBy,
        disputeStatus: review.disputeStatus,
        disputeReason: review.disputeReason,
        disputedAt: review.disputedAt,
      })
    }
  },

  // ── Identite ──────────────────────────────────────────────────────────────────
  'identity/addIdentityProfile': async (payload) => {
    await upsert('identity_profiles', identityToRemoteRow(payload))
  },
  'identity/updateIdentityProfile': async (payload, state) => {
    const profile = state.identity.profiles.find((item) => item.id === payload.id)
    if (profile) await upsert('identity_profiles', identityToRemoteRow(profile))
  },
  'identity/removeIdentityProfile': async (payload) => {
    const { error } = await supabase.from('identity_profiles').delete().eq('id', payload)
    if (error) throw error
  },
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export const supabaseMiddleware = (store) => (next) => (action) => {
  const beforeState = store.getState()
  const result = next(action)

  const handler = handlers[action.type]
  if (handler && supabase) {
    withRetry(() =>
      handler(action.payload, store.getState(), store.dispatch, beforeState, store.getState),
    )
      .then(() => {
        if (action.type === 'communications/sendMessage') {
          const messageId = action.payload?.message?.id
          if (messageId) {
            store.dispatch({
              type: 'communications/setMessagePending',
              payload: {
                conversationId: action.payload.conversationId,
                messageId,
                pending: false,
              },
            })
          }
        }
      })
      .catch((err) => {
      console.warn('[Supabase]', action.type, err?.message || err)
      const aborted =
        err?.name === 'AbortError' || /^aborted$/i.test(String(err?.message || '').trim())
      if (aborted) return
      if (action.type === 'communications/sendMessage') {
        const messageId = action.payload?.message?.id
        if (messageId) {
          store.dispatch({
            type: 'communications/setMessageSyncFailed',
            payload: {
              conversationId: action.payload.conversationId,
              messageId,
              failed: true,
            },
          })
        }
      }
      if (action.type === 'posts/deleteComment') {
        const beforePost = beforeState.posts?.items?.find(
          (item) => item.id === action.payload?.postId,
        )
        const comment = beforePost?.comments?.find((item) => item.id === action.payload?.commentId)
        if (comment) {
          store.dispatch({
            type: 'posts/restoreComment',
            payload: { postId: action.payload.postId, comment },
          })
        }
      }
      if (action.type === 'reviews/deleteReview') {
        const review = beforeState.reviews.items.find((item) => item.id === action.payload)
        if (review) {
          store.dispatch({
            type: 'reviews/restoreReviewDeleted',
            payload: { review },
          })
        }
      }
      if (action.type === 'administration/purgeUserAccount') {
        store.dispatch(setAdminUsers(beforeState.administration?.users || []))
      }
      // Documents : ne jamais supprimer le fichier storage ni la fiche locale —
      // réessai sync / réparation auto (cron + Admin → Réparer).
      store.dispatch(
        addToast({
          title:
            action.type === 'account/addPersonalDocument' ||
            action.type === 'businesses/addBusinessDocument'
              ? 'Document déposé — synchronisation en cours'
              : 'Synchronisation impossible',
          message:
            action.type === 'account/addPersonalDocument' ||
            action.type === 'businesses/addBusinessDocument'
              ? sanitizeUserFacingMessage(
                  err?.message ||
                    'Le fichier est conservé. La fiche reste visible et sera rattachée automatiquement.',
                )
              : sanitizeUserFacingMessage(
                  err?.message || "L'enregistrement distant a échoué.",
                ),
          tone: 'error',
        }),
      )
    })
  }

  return result
}
