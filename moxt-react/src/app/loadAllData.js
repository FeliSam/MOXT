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
import { listingFromRemoteRow, mergeListingQuestions } from '../features/marketplace/marketplaceRemote'
import { fromRow, fromRows } from '../services/remoteRowMapper'
import { fetchUserConversations } from '@moxt/shared/utils/fetchUserConversations.js'

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

function mergeRemoteItems(localItems = [], remoteItems = []) {
  const merged = new Map((localItems || []).map((item) => [item.id, item]))
  for (const item of remoteItems || []) {
    merged.set(item.id, { ...merged.get(item.id), ...item })
  }
  return [...merged.values()]
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
      notificationsRes,
      postsRes,
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
      supabase.from('p2p_orders').select('*').eq('buyer_id', uid).limit(USER_LIMIT),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('disputes').select('*').or(`reporter_id.eq.${uid},target_id.eq.${uid}`).limit(USER_LIMIT),
      supabase.from('payments').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(USER_LIMIT),
      supabase.from('wallet_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(USER_LIMIT),
      supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
      supabase.from('posts').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(100),
    ])

    assertLoaded(listingsRes, 'des annonces')
    if (listingQuestionsRes.error) {
      console.warn('[MOXT] Chargement des questions annonces:', listingQuestionsRes.error.message)
    }
    if (businessesRes.error) {
      console.warn('[MOXT] Chargement des entreprises:', businessesRes.error.message)
    }

    const listingsWithQuestions = mergeListingQuestions(
      listingsRes.data.map(listingFromRemoteRow),
      listingQuestionsRes.data || [],
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

    batch(() => {
      dispatch(setMarketplace({ items: listingsWithQuestions }))
      dispatch(setParcels({ items: fromRows(parcelsRes.data), requests: fromRows(parcelRequestsRes.data) }))
      dispatch(setJobs({ items: fromRows(jobsRes.data), applications: fromRows(jobApplicationsRes.data) }))
      dispatch(setEvents({ items: fromRows(eventsRes.data), registrations: fromRows(eventRegistrationsRes.data) }))
      dispatch(setBusinesses({ items: mergedBusinesses }))
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
