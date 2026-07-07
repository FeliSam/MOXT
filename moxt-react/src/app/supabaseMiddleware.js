import { supabase } from '../services/supabaseClient'
import { saveListingRemote } from '../features/marketplace/marketplaceRemote'
import {
  persistConversationRemote,
  persistMessageForConversation,
  persistMessageRemote,
  resolveCanonicalConversationId,
} from '../features/communications/conversationPersist'
import { normalizeConversation, replaceConversationId } from '../features/communications/communicationSlice'
import { fromRow } from '../services/remoteRowMapper'
import { addToast } from '../features/ui/uiSlice'

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
    relatedType: 'related_type',
    relatedPath: 'related_path',
    requesterName: 'requester_name',
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
    organizerContact: 'organizer_contact',
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

  // ── Jobs ─────────────────────────────────────────────────────────────────────
  'jobs/createJob': async (payload) => {
    await upsert('jobs', payload)
  },
  'jobs/applyToJob': async (payload) => {
    const { error } = await supabase.from('job_applications').upsert(
      { ...toSnake(payload), job_id: payload.jobId, user_id: payload.userId },
      { onConflict: 'id' },
    )
    if (error) throw error
  },
  'jobs/updateApplicationStatus': async (payload) => {
    await update('job_applications', payload.id, { status: payload.status })
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

  // ── Entreprises ───────────────────────────────────────────────────────────────
  'businesses/saveBusiness': async (payload) => {
    await upsert('businesses', payload)
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
      })
      .eq('id', canonicalId)
  },
  'communications/markConversationRead': async (payload, state) => {
    await syncConversationRow(state, payload.conversationId)
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
      fee: payload.fee,
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
        timeline: transfer.timeline,
      })
      if (transfer.status === 'completed') {
        triggerEmail(transfer.id, 'validated').catch(() => {})
      }
    }
  },

  // ── P2P ───────────────────────────────────────────────────────────────────────
  'p2p/createP2POffer': async (payload) => {
    await upsert('p2p_offers', payload)
  },
  'p2p/createP2POrder': async (payload) => {
    await upsert('p2p_orders', payload)
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
      read: false,
      created_at: payload.createdAt,
    })
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
  'posts/toggleLike': async (payload, state) => {
    const post = state.posts?.items?.find((p) => p.id === payload.postId)
    if (!post) return
    const { error } = await supabase
      .from('posts')
      .update({ likes: JSON.stringify(post.likes), updated_at: new Date().toISOString() })
      .eq('id', payload.postId)
    if (error) throw error
  },
  'posts/addComment': async (payload, state) => {
    const post = state.posts?.items?.find((p) => p.id === payload.postId)
    if (!post) return
    const { error } = await supabase
      .from('posts')
      .update({ comments: JSON.stringify(post.comments), updated_at: new Date().toISOString() })
      .eq('id', payload.postId)
    if (error) throw error
  },
  'posts/deleteComment': async (payload, state) => {
    const post = state.posts?.items?.find((p) => p.id === payload.postId)
    if (!post) return
    const { error } = await supabase
      .from('posts')
      .update({ comments: JSON.stringify(post.comments), updated_at: new Date().toISOString() })
      .eq('id', payload.postId)
    if (error) throw error
  },

  // ── Favoris ───────────────────────────────────────────────────────────────────
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
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export const supabaseMiddleware = (store) => (next) => (action) => {
  const result = next(action)

  const handler = handlers[action.type]
  if (handler && supabase) {
    withRetry(() => handler(action.payload, store.getState(), store.dispatch)).catch((err) => {
      console.warn('[Supabase]', action.type, err?.message || err)
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
