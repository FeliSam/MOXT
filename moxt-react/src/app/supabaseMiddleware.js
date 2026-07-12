import { supabase } from '../services/supabaseClient'
import { saveListingRemote } from '../features/marketplace/marketplaceRemote'
import { saveJobApplicationRemote, saveJobRemote } from '../features/jobs/jobRemote'
import { saveBusinessRemote, upsertBusinessDocumentRemote, upsertBusinessMemberRemote, upsertBusinessRequestRemote } from '../features/businesses/businessRemote'
import { reviewToRemoteRow } from '../features/reviews/reviewRemote'
import { identityToRemoteRow } from '../features/identity/identityRemote'
import { p2pOfferToRemoteRow, p2pOrderToRemoteRow, reportToRemoteRow, subscriberBanToRemoteRow, subscriberReportToRemoteRow } from '../features/sync/entityRemote'
import {
  persistConversationRemote,
  persistMessageForConversation,
  persistMessageRemote,
  resolveCanonicalConversationId,
} from '../features/communications/conversationPersist'
import { normalizeConversation, replaceConversationId } from '../features/communications/communicationSlice'
import { fromRow } from '../services/remoteRowMapper'
import { addToast } from '../features/ui/uiSlice'
import { authService } from '../features/auth/authService'
import { selectAccountPreferences } from '../features/account/accountSlice'

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
    contractType: 'contract_type',
    experienceLevel: 'experience_level',
    salaryPeriod: 'salary_period',
    startDate: 'start_date',
    applicationDeadline: 'application_deadline',
    applicantName: 'applicant_name',
    expiresAt: 'expires_at',
    startAt: 'start_at',
    logoUrl: 'logo_url',
    bannerUrl: 'banner_url',
    primaryActivity: 'primary_activity',
    secondaryActivity: 'secondary_activity',
    feePercent: 'fee_percent',
    averageDelay: 'average_delay',
    exchangeMethods: 'exchange_methods',
    transferAccounts: 'transfer_accounts',
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
    documentIds: 'document_ids',
    receivedAmount: 'received_amount',
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

async function upsert(table, data) {
  const { error } = await supabase.from(table).upsert(toSnake(data), { onConflict: 'id' })
  if (error) throw error
}

async function update(table, id, fields) {
  const { error } = await supabase
    .from(table)
    .update({ ...toSnake(fields), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
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
  'marketplace/reportListing': async (payload) => {
    await upsert('listing_reports', reportToRemoteRow(payload, 'listing_id'))
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
      ...parcelData
    } = payload
    const cleaned = {
      ...parcelData,
      maxWeightPerItem: parcelData.maxWeightPerItem !== '' ? parcelData.maxWeightPerItem : null,
      travelProofUrl: parcelData.travelProofUrl || parcelData.travelProofFile?.url || null,
    }
    await upsert('parcels', cleaned)
  },
  'parcels/requestParcelReservation': async (payload) => {
    await upsert('parcel_requests', payload)
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
  'parcels/updateParcelStatus': async (payload) => {
    await update('parcels', payload.id, { status: payload.status })
  },
  'parcels/updateParcel': async (payload, state) => {
    const parcel = state.parcels.items.find((item) => item.id === payload.id)
    if (parcel) await upsert('parcels', parcel)
  },
  'parcels/cancelParcelRequest': async (payload) => {
    await update('parcel_requests', payload.id, { status: 'cancelled' })
  },

  // ── Litiges ───────────────────────────────────────────────────────────────────
  'disputes/openDispute': async (payload) => {
    await upsert('disputes', {
      id: payload.id,
      reporterId: payload.reporterId || payload.openedBy,
      businessId: payload.businessId,
      relatedType: payload.relatedType,
      relatedId: payload.relatedId,
      reason: payload.reason,
      evidence: payload.evidence,
      status: payload.status,
      createdAt: payload.createdAt,
    })
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
  'jobs/reportJob': async (payload) => {
    await upsert('job_reports', reportToRemoteRow(payload, 'job_id'))
  },
  'jobs/updateJobReportStatus': async (payload) => {
    await update('job_reports', payload.id, { status: payload.status })
  },

  // ── Événements ───────────────────────────────────────────────────────────────
  'events/createEvent': async (payload) => {
    await upsert('events', payload)
  },
  'events/registerForEvent': async (payload) => {
    const { error } = await supabase.from('event_registrations').upsert(
      { ...toSnake(payload), event_id: payload.eventId, user_id: payload.userId },
      { onConflict: 'id' },
    )
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
  'events/reportEvent': async (payload) => {
    await upsert('event_reports', reportToRemoteRow(payload, 'event_id'))
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
  'businesses/addBusinessDocument': async (payload) => {
    await upsertBusinessDocumentRemote(payload)
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
  'businesses/updateBusinessStatus': async (payload) => {
    await update('businesses', payload.id, { status: payload.status })
  },

  // ── Messagerie ────────────────────────────────────────────────────────────────
  'communications/createConversation': async (payload) => {
    const { messages, messagesLoaded, drafts: _drafts, ...conv } = payload
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
    await supabase
      .from('conversations')
      .update({
        updated_at: msg.createdAt,
        message_count: conversation.messageCount ?? null,
        unread_by: unreadBy,
        last_message_text: msg.text,
        last_message_sender_id: msg.senderId,
        last_message_at: msg.createdAt,
      })
      .eq('id', canonicalId)
  },
  'communications/markConversationRead': async (payload, state, dispatch) => {
    const conversation = state.communications.conversations.find(
      (c) => c.id === payload.conversationId,
    )
    if (!conversation) return

    await syncConversationRow(state, payload.conversationId)

    const readerId = String(payload.userId)
    const peerMessages = conversation.messages.filter(
      (message) => String(message.senderId) !== readerId,
    )
    for (const message of peerMessages) {
      const readBy = (message.readBy || []).map(String)
      if (!readBy.includes(readerId)) continue
      await syncMessageRow(message, conversation, dispatch)
    }
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
    await upsert('transfers', {
      id: payload.id,
      userId: payload.userId,
      originCountry: payload.originCountry,
      businessId: payload.businessId,
      businessOwnerId: payload.businessOwnerId,
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
      payload: {
        amountSent: payload.amountSent,
        amountReceived: payload.amountReceived,
        fees: payload.fees,
        totalToPay: payload.totalToPay,
        currencyFrom: payload.currencyFrom,
        currencyTo: payload.currencyTo,
        feePercent: payload.feePercent,
        rateMarginPercent: payload.rateMarginPercent,
        rawRate: payload.rawRate,
      },
    })
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
    const transfer = state.transfers.items.find((t) => t.id === payload)
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

    const mergedPayload = {
      ...(typeof transfer.payload === 'object' && transfer.payload ? transfer.payload : {}),
      amountSent: transfer.amountSent,
      amountReceived: transfer.amountReceived,
      fees: transfer.fees,
      totalToPay: transfer.totalToPay,
      currencyFrom: transfer.currencyFrom,
      currencyTo: transfer.currencyTo,
      feePercent: transfer.feePercent,
      receivedAt: transfer.receivedAt,
      receivedMethod: transfer.receivedMethod,
      receivedProof: transfer.receivedProof,
    }

    await update('transfers', transfer.id, {
      status: transfer.status,
      receivedAmount: transfer.receivedAmount,
      timeline: transfer.timeline,
      updatedAt: transfer.updatedAt,
      payload: mergedPayload,
    })
  },

  // ── P2P ───────────────────────────────────────────────────────────────────────
  'p2p/createOffer': async (payload) => {
    await upsert('p2p_offers', p2pOfferToRemoteRow(payload))
  },
  'p2p/acceptOffer': async (payload) => {
    await upsert('p2p_orders', p2pOrderToRemoteRow(payload))
    await update('p2p_offers', payload.offerId, { status: 'accepted' })
  },
  'p2p/updateOrderStatus': async (payload, state) => {
    const order = state.p2p.orders.find((item) => item.id === payload.id)
    if (order) {
      await upsert('p2p_orders', p2pOrderToRemoteRow(order))
    }
  },
  'p2p/addOrderProof': async (payload, state) => {
    const order = state.p2p.orders.find((item) => item.id === payload.id)
    if (order) await upsert('p2p_orders', p2pOrderToRemoteRow(order))
  },
  'p2p/rateOrder': async (payload, state) => {
    const order = state.p2p.orders.find((item) => item.id === payload.id)
    if (order) await upsert('p2p_orders', p2pOrderToRemoteRow(order))
  },

  // ── Notifications ─────────────────────────────────────────────────────────────
  'communications/addNotification': async (payload, state) => {
    const currentUser = state.auth.user
    if (!currentUser || payload.userId === currentUser.id || payload.type === 'message') return
    const { error } = await supabase.from('notifications').insert({
      id: payload.id,
      user_id: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'system',
      link: payload.link || null,
      priority: payload.priority || 'normal',
      read: false,
      archived: payload.archived === true,
      created_at: payload.createdAt,
    })
    if (error) throw error
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
    const { error } = await supabase.from('posts').insert({
      id: payload.id,
      author_id: payload.authorId,
      author_name: payload.authorName,
      author_avatar_url: payload.authorAvatarUrl || null,
      source_type: payload.sourceType || 'free',
      source_id: payload.sourceId || null,
      message: payload.message,
      image_url: payload.imageUrl || null,
      direct_link: payload.directLink || null,
      likes: JSON.stringify(payload.likes ?? []),
      comments: JSON.stringify(payload.comments ?? []),
      last_shared_at: payload.lastSharedAt || payload.createdAt,
      status: 'published',
      created_at: payload.createdAt,
      updated_at: payload.updatedAt,
    })
    if (error) throw error
  },
  'posts/updatePost': async (payload) => {
    const fields = {}
    if (payload.message !== undefined) fields.message = payload.message
    if (payload.imageUrl !== undefined) fields.image_url = payload.imageUrl
    fields.updated_at = payload.updatedAt || new Date().toISOString()
    const { error } = await supabase.from('posts').update(fields).eq('id', payload.id)
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
  'posts/deleteComment': async (payload) => {
    const { error } = await supabase.rpc('moxt_post_delete_comment', {
      p_post_id: payload.postId,
      p_comment_id: payload.commentId,
    })
    if (error) throw error
  },

  // ── Favoris ───────────────────────────────────────────────────────────────────
  'account/upsertPublisherSubscription': async (payload) => {
    await upsert('publisher_subscriptions', {
      id: payload.id,
      subscriber_id: payload.userId,
      publisher_type: payload.publisherType,
      publisher_id: payload.publisherId,
      notify_pref: payload.notifyPref,
      publisher_name: payload.publisherName,
      publisher_path: payload.publisherPath,
      created_at: payload.createdAt,
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
    await upsert('publisher_subscriptions', {
      id: subscription.id,
      subscriber_id: subscription.userId,
      publisher_type: subscription.publisherType,
      publisher_id: subscription.publisherId,
      notify_pref: subscription.notifyPref,
      publisher_name: subscription.publisherName,
      publisher_path: subscription.publisherPath,
      created_at: subscription.createdAt,
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
  'account/reportPublisherSubscriber': async (payload) => {
    await upsert('subscriber_reports', subscriberReportToRemoteRow(payload))
  },
  'account/updateSubscriberReportStatus': async (payload) => {
    await update('subscriber_reports', payload.id, { status: payload.status })
  },
  'account/toggleAccountFavorite': async (payload, state) => {
    const exists = state.account.favorites.some(
      (f) => f.relatedId === payload.relatedId && f.userId === payload.userId,
    )
    if (exists) {
      const fav = state.account.favorites.find(
        (f) => f.relatedId === payload.relatedId && f.userId === payload.userId,
      )
      if (fav) {
        const { snapshot: _snapshot, ...remoteFav } = fav
        await upsert('favorites', remoteFav)
      }
    } else {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', payload.userId)
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
  'account/addPersonalDocument': async (payload) => {
    await upsert('personal_documents', payload)
  },
  'account/removePersonalDocument': async (payload) => {
    const { error } = await supabase
      .from('personal_documents')
      .delete()
      .eq('id', payload.id)
      .eq('user_id', payload.userId)
    if (error) throw error
  },
  'account/submitVerificationRequest': async (payload) => {
    await upsert('verification_requests', {
      ...payload,
      documentIds: payload.documentIds || [],
    })
  },
  'account/updateVerificationStatus': async (payload, state) => {
    const request = state.account.verificationRequests.find((item) => item.id === payload.id)
    if (request) {
      await update('verification_requests', request.id, {
        status: request.status,
        reviewedAt: request.reviewedAt,
        reviewedBy: request.reviewedBy,
      })
      if (request.status === 'verified' && request.userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'verified', updated_at: new Date().toISOString() })
          .eq('id', request.userId)
        if (error) throw error
      }
    }
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
  'administration/updateUserRole': async (payload) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: payload.role, updated_at: new Date().toISOString() })
      .eq('id', payload.id)
    if (error) throw error
  },
  'administration/updateUserStatus': async (payload) => {
    const profileStatus = payload.status === 'suspended' ? 'suspended' : 'active'
    const { error } = await supabase
      .from('profiles')
      .update({ status: profileStatus, updated_at: new Date().toISOString() })
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
    const { error } = await supabase.from('support_tickets').insert({
      id: payload.id,
      user_id: payload.userId,
      user_name: payload.userName,
      subject: payload.subject,
      priority: payload.priority,
      status: payload.status,
      messages: payload.messages,
      created_at: payload.createdAt,
      updated_at: payload.updatedAt,
    })
    if (error) throw error
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
      if (error) throw error
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
    await upsert('receipts', {
      ...payload,
      details: payload.details || {},
    })
  },
  'finance/upsertTransferReceipt': async (payload) => {
    await upsert('receipts', {
      ...payload,
      details: payload.details || {},
    })
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

  // ── Avis ──────────────────────────────────────────────────────────────────────
  'reviews/createReview': async (payload, state) => {
    const review =
      state.reviews.items.find((item) => item.id === payload.id) ||
      state.reviews.items.find(
        (item) =>
          item.authorId === payload.authorId &&
          item.targetType === payload.targetType &&
          item.targetId === payload.targetId,
      ) ||
      payload
    await upsert('reviews', reviewToRemoteRow(review))
  },
  'reviews/replyToReview': async (payload, state) => {
    const review = state.reviews.items.find((item) => item.id === payload.id)
    if (review) await upsert('reviews', reviewToRemoteRow(review))
  },
  'reviews/contestReview': async (payload, state) => {
    const review = state.reviews.items.find((item) => item.id === payload.id)
    if (review) await upsert('reviews', reviewToRemoteRow(review))
  },
  'reviews/moderateReview': async (payload, state) => {
    const review = state.reviews.items.find((item) => item.id === payload.id)
    if (review) {
      await update('reviews', review.id, {
        status: review.status,
        moderatedAt: review.moderatedAt,
        moderatedBy: review.moderatedBy,
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
  const result = next(action)

  const handler = handlers[action.type]
  if (handler && supabase) {
    withRetry(() => handler(action.payload, store.getState(), store.dispatch)).catch((err) => {
      console.warn('[Supabase]', action.type, err?.message || err)
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
      store.dispatch(
        addToast({
          title: 'Synchronisation impossible',
          message: err?.message || "L'enregistrement distant a échoué.",
          tone: 'error',
        }),
      )
    })
  }

  return result
}
