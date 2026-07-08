import { createAsyncThunk } from '@reduxjs/toolkit'
import { batch } from 'react-redux'
import { supabase } from '../services/supabaseClient'
import { setAll as setMarketplace } from '../features/marketplace/marketplaceSlice'
import { setAll as setParcels } from '../features/parcels/parcelSlice'
import { setAll as setJobs } from '../features/jobs/jobSlice'
import { setAll as setEvents } from '../features/events/eventSlice'
import { setAll as setBusinesses } from '../features/businesses/businessSlice'
import { setAll as setTransfers } from '../features/transfers/transferSlice'
import { setAll as setP2P } from '../features/p2p/p2pSlice'
import { setAll as setCommunications, mergeConversations, normalizeConversation } from '../features/communications/communicationSlice'
import { setAll as setReviews } from '../features/reviews/reviewSlice'
import { setAll as setDisputes } from '../features/disputes/disputeSlice'
import { setAll as setFinance } from '../features/finance/financeSlice'
import { setAll as setPosts } from '../features/posts/postsSlice'
import { setRecipientAddresses } from '../features/addresses/recipientAddressesSlice'
import { hydrateAccountPreferences, mergeRemoteAccount } from '../features/account/accountSlice'
import { listingFromRemoteRow, mergeListingQuestions } from '../features/marketplace/marketplaceRemote'
import { fromRow, fromRows } from '../services/remoteRowMapper'
import { fetchUserConversations } from '@moxt/shared/utils/fetchUserConversations.js'

// Nombre max de lignes pour les tables publiques paginées au login
const PUBLIC_LIMIT = 50
const USER_LIMIT = 200

function safeRows(result, label) {
  if (result?.error) {
    console.warn(`[MOXT] Chargement ${label}:`, result.error.message)
    return []
  }
  return result?.data || []
}

function parseJsonField(value, fallback) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function mergeRemoteItems(localItems = [], remoteItems = []) {
  const merged = new Map((localItems || []).map((item) => [item.id, item]))
  for (const item of remoteItems || []) {
    merged.set(item.id, { ...merged.get(item.id), ...item })
  }
  return [...merged.values()]
}

function mergeRemoteRowsById(...groups) {
  const merged = new Map()
  for (const group of groups) {
    for (const row of fromRows(group || [])) {
      if (row?.id) merged.set(row.id, { ...merged.get(row.id), ...row })
    }
  }
  return [...merged.values()]
}

async function fetchIncomingRows(table, foreignKey, ownerIds, limit = USER_LIMIT) {
  if (!ownerIds.length) return []
  const { data, error } = await supabase.from(table).select('*').in(foreignKey, ownerIds).limit(limit)
  if (error) {
    console.warn(`[MOXT] Chargement ${table} (vue propriétaire):`, error.message)
    return []
  }
  return data || []
}

export const loadAllData = createAsyncThunk(
  'app/loadAllData',
  async (_, { getState, dispatch }) => {
    const { user } = getState().auth
    if (!user) return

    const uid = user.id

    const [
      listingsRes, listingQuestionsRes, parcelsRes, parcelRequestsRes,
      jobsRes, jobApplicationsRes,
      eventsRes, eventRegistrationsRes,
      businessesRes,
      transfersRes,
      favoritesRes, transferProfilesRes, verificationRequestsRes, personalDocumentsRes,
      p2pOffersRes, p2pOrdersRes,
      reviewsRes,
      disputesRes,
      paymentsRes, walletEntriesRes,
      receiptsRes,
      notificationsRes,
      postsRes,
      supportTicketsRes,
      recipientAddressesRes,
      profileRes,
    ] = await Promise.all([
      supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase
        .from('listing_questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('parcels').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('parcel_requests').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('job_applications').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('event_registrations').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('transfers').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(USER_LIMIT),
      supabase.from('favorites').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('transfer_profiles').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('verification_requests').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('personal_documents').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('p2p_offers').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('p2p_orders').select('*').or(`buyer_id.eq.${uid},seller_id.eq.${uid}`).limit(USER_LIMIT),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('disputes').select('*').or(`reporter_id.eq.${uid},target_id.eq.${uid}`).limit(USER_LIMIT),
      supabase.from('payments').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(USER_LIMIT),
      supabase.from('wallet_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(USER_LIMIT),
      supabase.from('receipts').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(USER_LIMIT),
      supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
      supabase.from('posts').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(100),
      supabase.from('support_tickets').select('*').eq('user_id', uid).order('updated_at', { ascending: false }).limit(50),
      supabase.from('recipient_addresses').select('*').eq('user_id', uid).order('updated_at', { ascending: false }).limit(USER_LIMIT),
      supabase.from('profiles').select('activity_visibility').eq('id', uid).maybeSingle(),
    ])

    if (listingQuestionsRes.error) {
      console.warn('[MOXT] Chargement des questions annonces:', listingQuestionsRes.error.message)
    }
    if (businessesRes.error) {
      console.warn('[MOXT] Chargement des entreprises:', businessesRes.error.message)
    }

    const listingsWithQuestions = listingsRes.error
      ? getState().marketplace.items
      : mergeListingQuestions(
          (listingsRes.data || []).map(listingFromRemoteRow),
          safeRows(listingQuestionsRes, 'des questions annonces'),
        )

    const ownedParcelIds = (parcelsRes.data || [])
      .filter((parcel) => parcel.owner_id === uid)
      .map((parcel) => parcel.id)
    const ownedJobIds = (jobsRes.data || [])
      .filter((job) => job.owner_id === uid)
      .map((job) => job.id)
    const ownedEventIds = (eventsRes.data || [])
      .filter((event) => event.owner_id === uid)
      .map((event) => event.id)

    const [incomingParcelRequests, incomingJobApplications, incomingEventRegistrations] =
      await Promise.all([
        fetchIncomingRows('parcel_requests', 'parcel_id', ownedParcelIds),
        fetchIncomingRows('job_applications', 'job_id', ownedJobIds),
        fetchIncomingRows('event_registrations', 'event_id', ownedEventIds),
      ])

    const parcelRequests = mergeRemoteRowsById(
      parcelRequestsRes.data,
      incomingParcelRequests,
    )
    const jobApplications = mergeRemoteRowsById(
      jobApplicationsRes.data,
      incomingJobApplications,
    )
    const eventRegistrations = mergeRemoteRowsById(
      eventRegistrationsRes.data,
      incomingEventRegistrations,
    )

    const { data: conversationRows, error: conversationsError } = await fetchUserConversations(
      supabase,
      uid,
      { limit: 100 },
    )
    if (conversationsError) {
      console.warn('[MOXT] Chargement des conversations:', conversationsError.message)
    }

    const conversations = mergeConversations(
      getState().communications.conversations,
      fromRows(conversationRows || []).map((conv) =>
        normalizeConversation({ ...conv, messages: [], messagesLoaded: false }),
      ),
    )

    const mergedBusinesses = mergeRemoteItems(
      getState().businesses.items,
      fromRows(businessesRes.data || []),
    )

    const supportTickets = safeRows(supportTicketsRes, 'des tickets support').map((row) => {
      const ticket = fromRow(row)
      return {
        ...ticket,
        messages: parseJsonField(ticket.messages, []),
      }
    })

    batch(() => {
      dispatch(setMarketplace({ items: listingsWithQuestions }))
      dispatch(setParcels({ items: fromRows(parcelsRes.data), requests: parcelRequests }))
      dispatch(setJobs({ items: fromRows(jobsRes.data), applications: jobApplications }))
      dispatch(setEvents({ items: fromRows(eventsRes.data), registrations: eventRegistrations }))
      dispatch(setBusinesses({ items: mergedBusinesses }))
      dispatch(setTransfers({ items: fromRows(transfersRes.data) }))
      dispatch(setCommunications({
        conversations,
        notifications: fromRows(notificationsRes.data),
        support: supportTickets,
      }))
      dispatch(setP2P({ offers: fromRows(p2pOffersRes.data), orders: fromRows(p2pOrdersRes.data) }))
      dispatch(setReviews({ items: fromRows(reviewsRes.data) }))
      dispatch(setDisputes({ items: fromRows(disputesRes.data) }))
      dispatch(setFinance({
        payments: fromRows(safeRows(paymentsRes, 'des paiements')),
        walletEntries: fromRows(safeRows(walletEntriesRes, 'du portefeuille')),
        receipts: fromRows(safeRows(receiptsRes, 'des recus')).map((item) => ({
          ...item,
          details: parseJsonField(item.details, {}),
        })),
      }))
      dispatch(setPosts({ items: fromRows(postsRes.data).map((p) => ({
        ...p,
        likes: parseJsonField(p.likes, []),
        comments: parseJsonField(p.comments, []),
      })) }))
      dispatch(mergeRemoteAccount({
        favorites: fromRows(safeRows(favoritesRes, 'des favoris')),
        transferProfiles: fromRows(safeRows(transferProfilesRes, 'des profils transfert')),
        documents: fromRows(safeRows(personalDocumentsRes, 'des documents')),
        verificationRequests: fromRows(
          safeRows(verificationRequestsRes, 'des demandes de verification'),
        ).map((item) => ({
          ...item,
          documentIds: parseJsonField(item.documentIds, []),
        })),
      }))
      dispatch(setRecipientAddresses(fromRows(safeRows(recipientAddressesRes, 'des adresses')))
      if (profileRes.data?.activity_visibility) {
        dispatch(
          hydrateAccountPreferences({
            userId: uid,
            preferences: { activityVisibility: profileRes.data.activity_visibility },
          }),
        )
      }
    })
  },
)
