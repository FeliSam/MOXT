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
import { setAll as setAccount } from '../features/account/accountSlice'
import { setAll as setPosts } from '../features/posts/postsSlice'
import { listingFromRemoteRow } from '../features/marketplace/marketplaceRemote'
import { fromRow, fromRows } from '../services/remoteRowMapper'

// Nombre max de lignes pour les tables publiques paginées au login
const PUBLIC_LIMIT = 50
const USER_LIMIT = 200

function assertLoaded(result, label) {
  if (result.error) {
    throw new Error(`Chargement ${label} impossible : ${result.error.message}`)
  }
  return result.data || []
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

export const loadAllData = createAsyncThunk(
  'app/loadAllData',
  async (_, { getState, dispatch }) => {
    const { user } = getState().auth
    if (!user) return

    const uid = user.id

    const [
      listingsRes, parcelsRes, parcelRequestsRes,
      jobsRes, jobApplicationsRes,
      eventsRes, eventRegistrationsRes,
      businessesRes,
      transfersRes,
      // Conversations sans messages — les messages sont chargés à la demande
      conversationsRes,
      favoritesRes, transferProfilesRes, verificationRequestsRes, personalDocumentsRes,
      p2pOffersRes, p2pOrdersRes,
      reviewsRes,
      disputesRes,
      paymentsRes, walletEntriesRes,
      notificationsRes,
      postsRes,
    ] = await Promise.all([
      supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('parcels').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('parcel_requests').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('job_applications').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('event_registrations').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('transfers').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(USER_LIMIT),
      // Métadonnées seulement — pas de messages embarqués pour éviter le chargement massif
      supabase.from('conversations').select('*').contains('participant_ids', [uid]).order('updated_at', { ascending: false }).limit(100),
      supabase.from('favorites').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('transfer_profiles').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('verification_requests').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('personal_documents').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('p2p_offers').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('p2p_orders').select('*').eq('buyer_id', uid).limit(USER_LIMIT),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('disputes').select('*').or(`reporter_id.eq.${uid},target_id.eq.${uid}`).limit(USER_LIMIT),
      supabase.from('payments').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(USER_LIMIT),
      supabase.from('wallet_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(USER_LIMIT),
      supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
      supabase.from('posts').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(100),
    ])

    assertLoaded(listingsRes, 'des annonces')
    assertLoaded(conversationsRes, 'des conversations')

    const conversations = mergeConversations(
      getState().communications.conversations,
      fromRows(conversationsRes.data).map((conv) =>
        normalizeConversation({ ...conv, messages: [], messagesLoaded: false }),
      ),
    )

    batch(() => {
      dispatch(setMarketplace({ items: listingsRes.data.map(listingFromRemoteRow) }))
      dispatch(setParcels({ items: fromRows(parcelsRes.data), requests: fromRows(parcelRequestsRes.data) }))
      dispatch(setJobs({ items: fromRows(jobsRes.data), applications: fromRows(jobApplicationsRes.data) }))
      dispatch(setEvents({ items: fromRows(eventsRes.data), registrations: fromRows(eventRegistrationsRes.data) }))
      dispatch(setBusinesses({ items: fromRows(businessesRes.data) }))
      dispatch(setTransfers({ items: fromRows(transfersRes.data) }))
      dispatch(setCommunications({ conversations, notifications: fromRows(notificationsRes.data) }))
      dispatch(setP2P({ offers: fromRows(p2pOffersRes.data), orders: fromRows(p2pOrdersRes.data) }))
      dispatch(setReviews({ items: fromRows(reviewsRes.data) }))
      dispatch(setDisputes({ items: fromRows(disputesRes.data) }))
      dispatch(setFinance({ payments: fromRows(paymentsRes.data), walletEntries: fromRows(walletEntriesRes.data) }))
      dispatch(setPosts({ items: fromRows(postsRes.data).map((p) => ({
        ...p,
        likes: parseJsonField(p.likes, []),
        comments: parseJsonField(p.comments, []),
      })) }))
      dispatch(setAccount({
        favorites: fromRows(favoritesRes.data),
        transferProfiles: fromRows(transferProfilesRes.data),
        documents: fromRows(personalDocumentsRes.data),
        verificationRequests: fromRows(verificationRequestsRes.data),
      }))
    })
  },
)
