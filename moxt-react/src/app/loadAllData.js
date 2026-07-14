import { createAsyncThunk } from '@reduxjs/toolkit'
import { batch } from 'react-redux'
import { supabase } from '../services/supabaseClient'
import { setAll as setMarketplace } from '../features/marketplace/marketplaceSlice'
import { setAll as setParcels } from '../features/parcels/parcelSlice'
import { setAll as setJobs } from '../features/jobs/jobSlice'
import { jobsFromRemoteRows, jobApplicationsFromRemoteRows } from '../features/jobs/jobRemote'
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
import { profileRowToAdminUser, setAdminUsers } from '../features/administration/administrationSlice'
import { setUser } from '../features/auth/authSlice'
import { setIdentityProfiles } from '../features/identity/identitySlice'
import { listingFromRemoteRow, mergeListingQuestions } from '../features/marketplace/marketplaceRemote'
import { fromRow, fromRows } from '../services/remoteRowMapper'
import { fetchUserConversations } from '@moxt/shared/utils/fetchUserConversations.js'
import {
  businessFromRemoteRow,
  businessDocumentFromRemoteRow,
  businessMemberFromRemoteRow,
  businessRequestFromRemoteRow,
  syncLocalBusinessesToRemote,
} from '../features/businesses/businessRemote'
import { filterByBusinessIds, reconcileBusinesses } from '../features/businesses/businessSyncUtils'
import { matchUserId } from '../features/businesses/businessVisibility'
import { reviewFromRemoteRow } from '../features/reviews/reviewRemote'
import { identityFromRemoteRow } from '../features/identity/identityRemote'
import { transfersFromRemoteRows } from '../features/transfers/transferRemote'
import { p2pOrderFromRemoteRow, reportFromRemoteRow } from '../features/sync/entityRemote'

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
  async (_, { getState, dispatch, rejectWithValue }) => {
    const { user } = getState().auth
    if (!user) return

    if (!supabase) {
      return rejectWithValue('Connexion à la base de données indisponible. Rechargez la page.')
    }

    const uid = user.id

    try {

    const [profileRes, authUserRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('activity_visibility, role, preferences, status, phone, phone_verified, phone_verified_at')
        .eq('id', uid)
        .maybeSingle(),
      supabase.auth.getUser().catch(() => ({ data: { user: null } })),
    ])

    const resolvedRole = profileRes.data?.role || user.role || 'user'
    const isAdmin = ['admin', 'superadmin'].includes(resolvedRole)
    const authUser = authUserRes?.data?.user || null

    if (profileRes.data || authUser) {
      const profilePatch = {}
      if (profileRes.data?.role && profileRes.data.role !== user.role) {
        profilePatch.role = profileRes.data.role
      }
      if (profileRes.data) {
        const verified = profileRes.data.status === 'verified'
        if (verified !== Boolean(user.verified)) {
          profilePatch.verified = verified
          profilePatch.status = profileRes.data.status || user.status
        }
        if (profileRes.data.phone_verified === true && !user.phoneVerified) {
          profilePatch.phoneVerified = true
          profilePatch.phoneVerifiedAt = profileRes.data.phone_verified_at || null
        }
      }
      if (authUser) {
        const email = String(authUser.email || user.email || '').trim()
        const emailVerified = Boolean(authUser.email_confirmed_at)
        const emailVerifiedAt = authUser.email_confirmed_at || null
        if (email && email !== user.email) profilePatch.email = email
        if (emailVerified !== Boolean(user.emailVerified) || emailVerifiedAt !== user.emailVerifiedAt) {
          profilePatch.emailVerified = emailVerified
          profilePatch.emailVerifiedAt = emailVerifiedAt
        }
      }
      if (Object.keys(profilePatch).length) {
        dispatch(setUser({ ...user, ...profilePatch }))
      }
    }

    const [
      listingsRes, parcelsRes, parcelRequestsRes,
      jobsRes, jobApplicationsRes,
      eventsRes, eventRegistrationsRes,
      businessesRes,
      ownedBusinessesRes,
      favoritesRes, subscriptionsRes, subscriberBansRes, subscriberReportsRes, transferProfilesRes, verificationRequestsRes, personalDocumentsRes,
      p2pOffersRes, p2pOrdersRes,
      reviewsRes,
      disputesRes,
      paymentsRes, walletEntriesRes,
      receiptsRes,
      notificationsRes,
      postsRes,
      supportTicketsRes,
      recipientAddressesRes,
    ] = await Promise.all([
      supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('parcels').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('parcel_requests').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('job_applications').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('event_registrations').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
      supabase.from('businesses').select('*').eq('owner_id', uid),
      supabase.from('favorites').select('*').eq('user_id', uid).limit(USER_LIMIT),
      supabase.from('publisher_subscriptions').select('*').limit(USER_LIMIT),
      supabase.from('publisher_subscriber_bans').select('*').limit(USER_LIMIT),
      supabase.from('subscriber_reports').select('*').limit(USER_LIMIT),
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
      supabase.from('posts').select('*').eq('status', 'published').order('last_shared_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(100),
      supabase.from('support_tickets').select('*').eq('user_id', uid).order('updated_at', { ascending: false }).limit(50),
      supabase.from('recipient_addresses').select('*').eq('user_id', uid).order('updated_at', { ascending: false }).limit(USER_LIMIT),
    ])

    let adminBusinessesRes = { data: [], error: null }
    if (isAdmin) {
      adminBusinessesRes = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(USER_LIMIT)
    }

    const ownedBusinessesFailed = Boolean(ownedBusinessesRes.error)
    const publicBusinessesFailed = Boolean(businessesRes.error)

    if (businessesRes.error) {
      console.warn('[MOXT] Chargement des entreprises:', businessesRes.error.message)
    }
    if (ownedBusinessesRes.error) {
      console.warn('[MOXT] Chargement des entreprises possédées:', ownedBusinessesRes.error.message)
    }
    if (adminBusinessesRes.error) {
      console.warn('[MOXT] Chargement admin des entreprises:', adminBusinessesRes.error.message)
    }

    void syncLocalBusinessesToRemote(getState().businesses.items, uid)

    const listingIds = (listingsRes.data || []).map((listing) => listing.id).filter(Boolean)
    let listingQuestionRows = []
    if (listingIds.length) {
      const questionsRes = await supabase
        .from('listing_questions')
        .select('*')
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false })
        .limit(500)

      if (questionsRes.error) {
        console.warn('[MOXT] Chargement des questions annonces:', questionsRes.error.message)
      } else {
        listingQuestionRows = safeRows(questionsRes, 'des questions annonces')
      }
    }

    const remoteBusinessRows = mergeRemoteRowsById(
      businessesRes.error ? [] : safeRows(businessesRes, 'des entreprises'),
      ownedBusinessesRes.error ? [] : safeRows(ownedBusinessesRes, 'des entreprises possédées'),
      adminBusinessesRes.error ? [] : safeRows(adminBusinessesRes, 'des entreprises admin'),
    )

    const ownedBusinessIds = remoteBusinessRows
      .filter((row) => matchUserId(row.owner_id, uid))
      .map((row) => row.id)
      .filter(Boolean)

    const businessRequestsQueries = [
      supabase.from('business_requests').select('*').eq('owner_id', uid).limit(USER_LIMIT),
    ]
    if (ownedBusinessIds.length) {
      businessRequestsQueries.push(
        supabase.from('business_requests').select('*').in('business_id', ownedBusinessIds).limit(USER_LIMIT),
      )
    }
    const businessRequestsResults = await Promise.all(businessRequestsQueries)
    const businessRequestsRows = mergeRemoteRowsById(
      ...businessRequestsResults.map((result) => safeRows(result, 'des demandes entreprise')),
    )

    const transferFetchQueries = [
      supabase
        .from('transfers')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(USER_LIMIT),
      supabase
        .from('transfers')
        .select('*')
        .eq('business_owner_id', uid)
        .order('created_at', { ascending: false })
        .limit(USER_LIMIT),
    ]
    if (ownedBusinessIds.length) {
      transferFetchQueries.push(
        supabase
          .from('transfers')
          .select('*')
          .in('business_id', ownedBusinessIds)
          .order('created_at', { ascending: false })
          .limit(USER_LIMIT),
      )
    }
    const transferFetchResults = await Promise.all(transferFetchQueries)
    const mergedTransferRows = mergeRemoteRowsById(
      ...transferFetchResults.map((result) => safeRows(result, 'des transferts')),
    )

    const [
      businessMembersRes,
      businessDocumentsRes,
      identityProfilesRes,
      listingReportsRes,
      jobReportsRes,
      eventReportsRes,
      adminProfilesRes,
      deletionRequestsRes,
    ] = await Promise.all([
      ownedBusinessIds.length
        ? supabase.from('business_members').select('*').in('business_id', ownedBusinessIds).limit(USER_LIMIT)
        : Promise.resolve({ data: [] }),
      ownedBusinessIds.length
        ? supabase.from('business_documents').select('*').in('business_id', ownedBusinessIds).limit(USER_LIMIT)
        : Promise.resolve({ data: [] }),
      supabase.from('identity_profiles').select('*').eq('user_id', uid).limit(USER_LIMIT),
      isAdmin
        ? supabase.from('listing_reports').select('*').order('created_at', { ascending: false }).limit(USER_LIMIT)
        : supabase.from('listing_reports').select('*').eq('reporter_id', uid).limit(USER_LIMIT),
      isAdmin
        ? supabase.from('job_reports').select('*').order('created_at', { ascending: false }).limit(USER_LIMIT)
        : supabase.from('job_reports').select('*').eq('reporter_id', uid).limit(USER_LIMIT),
      isAdmin
        ? supabase.from('event_reports').select('*').order('created_at', { ascending: false }).limit(USER_LIMIT)
        : supabase.from('event_reports').select('*').eq('reporter_id', uid).limit(USER_LIMIT),
      isAdmin
        ? supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone, city, role, status, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(USER_LIMIT)
        : Promise.resolve({ data: [] }),
      isAdmin
        ? supabase
            .from('account_deletion_requests')
            .select('*')
            .eq('status', 'requested')
            .order('created_at', { ascending: false })
            .limit(USER_LIMIT)
        : supabase
            .from('account_deletion_requests')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(20),
    ])

    const listingsWithQuestions = listingsRes.error
      ? getState().marketplace.items
      : mergeListingQuestions(
          (listingsRes.data || []).map(listingFromRemoteRow),
          listingQuestionRows,
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
      fromRows(conversationRows || []).map((conv) => normalizeConversation({ ...conv, messages: [] })),
    )

    const remoteBusinesses = remoteBusinessRows.map(businessFromRemoteRow).filter(Boolean)
    const mergedBusinesses = reconcileBusinesses(
      getState().businesses.items,
      remoteBusinesses,
      uid,
      {
        preserveLocalOwnedOnRemoteError:
          ownedBusinessesFailed || publicBusinessesFailed || Boolean(adminBusinessesRes.error),
      },
    )
    const mergedBusinessIds = mergedBusinesses.map((item) => item.id)

    const mergedMembers = filterByBusinessIds(
      mergeRemoteItems(
        getState().businesses.members,
        safeRows(businessMembersRes, 'des membres entreprise').map(businessMemberFromRemoteRow).filter(Boolean),
      ),
      mergedBusinessIds,
    )
    const mergedDocuments = filterByBusinessIds(
      mergeRemoteItems(
        getState().businesses.documents,
        safeRows(businessDocumentsRes, 'des documents entreprise').map(businessDocumentFromRemoteRow).filter(Boolean),
      ),
      mergedBusinessIds,
    )
    const mergedRequests = filterByBusinessIds(
      mergeRemoteItems(
        getState().businesses.requests,
        businessRequestsRows.map(businessRequestFromRemoteRow).filter(Boolean),
      ),
      mergedBusinessIds,
    )

    const mergedReviews = mergeRemoteItems(
      getState().reviews.items,
      safeRows(reviewsRes, 'des avis').map(reviewFromRemoteRow).filter(Boolean),
    )

    const mergedIdentity = mergeRemoteItems(
      getState().identity.profiles,
      safeRows(identityProfilesRes, 'des profils identite').map(identityFromRemoteRow).filter(Boolean),
    )

    const listingReports = safeRows(listingReportsRes, 'des signalements annonces')
      .map((row) => reportFromRemoteRow(row, 'listing_id', 'listingId'))
      .filter(Boolean)
    const jobReports = safeRows(jobReportsRes, 'des signalements jobs')
      .map((row) => reportFromRemoteRow(row, 'job_id', 'jobId'))
      .filter(Boolean)
    const eventReports = safeRows(eventReportsRes, 'des signalements events')
      .map((row) => reportFromRemoteRow(row, 'event_id', 'eventId'))
      .filter(Boolean)

    const p2pOrders = safeRows(p2pOrdersRes, 'des commandes P2P')
      .map(p2pOrderFromRemoteRow)
      .filter(Boolean)

    const supportTickets = safeRows(supportTicketsRes, 'des tickets support').map((row) => {
      const ticket = fromRow(row)
      return {
        ...ticket,
        messages: parseJsonField(ticket.messages, []),
      }
    })

    batch(() => {
      dispatch(setMarketplace({
        items: listingsWithQuestions,
        reports: mergeRemoteItems(getState().marketplace.reports, listingReports),
      }))
      dispatch(setParcels({ items: fromRows(parcelsRes.data), requests: parcelRequests }))
      dispatch(setJobs({
        items: jobsFromRemoteRows(jobsRes.data),
        applications: jobApplicationsFromRemoteRows(jobApplications),
        reports: mergeRemoteItems(getState().jobs.reports, jobReports),
      }))
      dispatch(setEvents({
        items: fromRows(eventsRes.data),
        registrations: eventRegistrations,
        reports: mergeRemoteItems(getState().events.reports, eventReports),
      }))
      dispatch(setBusinesses({
        items: mergedBusinesses,
        members: mergedMembers,
        documents: mergedDocuments,
        requests: mergedRequests,
      }))
      dispatch(setTransfers({
        items: mergeRemoteItems(
          getState().transfers.items,
          transfersFromRemoteRows(mergedTransferRows),
        ),
      }))
      dispatch(setCommunications({
        conversations,
        notifications: fromRows(safeRows(notificationsRes, 'des notifications')).map((item) => ({
          ...item,
          priority: item.priority || 'normal',
          archived: item.archived === true,
        })),
        support: supportTickets,
      }))
      dispatch(setP2P({
        offers: fromRows(p2pOffersRes.data),
        orders: mergeRemoteItems(getState().p2p.orders, p2pOrders),
      }))
      dispatch(setReviews({ items: mergedReviews }))
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
        subscriptions: fromRows(safeRows(subscriptionsRes, 'des abonnements')).map((item) => ({
          ...item,
          userId: item.userId || item.subscriberId,
        })),
        subscriberBans: fromRows(safeRows(subscriberBansRes, 'des bannissements abonnes')).map(
          (item) => ({
            ...item,
            subscriberId: item.subscriberId || item.userId,
          }),
        ),
        subscriberReports: fromRows(safeRows(subscriberReportsRes, 'des signalements abonnes')).map(
          (item) => ({
            ...item,
            subscriberId: item.subscriberId || item.userId,
          }),
        ),
        transferProfiles: fromRows(safeRows(transferProfilesRes, 'des profils transfert')),
        documents: fromRows(safeRows(personalDocumentsRes, 'des documents')),
        verificationRequests: fromRows(
          safeRows(verificationRequestsRes, 'des demandes de verification'),
        ).map((item) => ({
          ...item,
          documentIds: parseJsonField(item.documentIds, []),
        })),
        deletionRequests: fromRows(
          safeRows(deletionRequestsRes, 'des demandes de suppression'),
        ).map((item) => ({
          ...item,
          userId: item.userId || item.user_id,
        })),
      }))
      if (isAdmin) {
        dispatch(
          setAdminUsers(
            safeRows(adminProfilesRes, 'des profils utilisateurs')
              .map(profileRowToAdminUser)
              .filter(Boolean),
          ),
        )
      }
      dispatch(setRecipientAddresses(fromRows(safeRows(recipientAddressesRes, 'des adresses'))))
      dispatch(setIdentityProfiles(mergedIdentity))
      const profilePreferences = parseJsonField(profileRes.data?.preferences, {})
      if (
        profileRes.data?.activity_visibility ||
        Object.keys(profilePreferences).length ||
        profilePreferences.language
      ) {
        dispatch(
          hydrateAccountPreferences({
            userId: uid,
            fromRemote: true,
            preferences: {
              ...profilePreferences,
              ...(profileRes.data?.activity_visibility
                ? { activityVisibility: profileRes.data.activity_visibility }
                : {}),
            },
          }),
        )
      }
    })
    } catch (error) {
      console.error('[MOXT] Échec du chargement des données:', error)
      return rejectWithValue(
        error instanceof Error ? error.message : 'Impossible de charger les données du site.',
      )
    }
  },
)
