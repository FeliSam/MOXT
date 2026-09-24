import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../services/supabaseClient'
import { fromRows } from '../../services/remoteRowMapper'
import {
  listingFromRemoteRow,
  mergeListingQuestions,
} from '../marketplace/marketplaceRemote'
import { setAll as setMarketplace } from '../marketplace/marketplaceSlice'
import { setAll as setParcels } from '../parcels/parcelSlice'
import { setAll as setJobs } from '../jobs/jobSlice'
import { setAll as setEvents } from '../events/eventSlice'
import { setAll as setVideos } from '../videos/videosSlice'
import { setAll as setPosts } from '../posts/postsSlice'
import { setAll as setBusinesses } from '../businesses/businessSlice'
import { businessFromRemoteRow } from '../businesses/businessRemote'
import { receiveRemoteOffer } from '../p2p/p2pSlice'
import { p2pOfferFromRemoteRow } from '../sync/entityRemote'
import { jobsFromRemoteRows } from '../jobs/jobRemote'
import { LISTINGS_PUBLIC_LIMIT } from '../../app/catalogConstants.js'

const PUBLIC_LIMIT = 50

function enrichEventFromRemoteRow(event) {
  if (!event || event.images?.length) return event
  try {
    const parsed = JSON.parse(event.program || '{}')
    if (Array.isArray(parsed.images) && parsed.images.length) {
      return { ...event, images: parsed.images }
    }
  } catch {
    // program may be plain text
  }
  return event
}

/** Recharge uniquement les catalogues publications (pas tout loadAllData). */
export const refreshPublicationsData = createAsyncThunk(
  'publications/refreshPublicationsData',
  async (_, { dispatch, getState, rejectWithValue }) => {
    if (!supabase) {
      return rejectWithValue('Connexion indisponible')
    }
    const uid = getState().auth.user?.id
    if (!uid) return null

    const [listingsRes, parcelsRes, jobsRes, eventsRes, videosRes, offersRes, postsRes, businessesRes] = await Promise.all([
      supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(LISTINGS_PUBLIC_LIMIT),
      supabase
        .from('parcels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PUBLIC_LIMIT),
      supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PUBLIC_LIMIT),
      supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PUBLIC_LIMIT),
      supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PUBLIC_LIMIT),
      supabase
        .from('p2p_offers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PUBLIC_LIMIT),
      supabase
        .from('posts')
        .select('*')
        .or(`status.eq.published,author_id.eq.${uid}`)
        .order('created_at', { ascending: false })
        .limit(40),
      supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
    ])

    if (!listingsRes.error) {
      dispatch(
        setMarketplace({
          items: mergeListingQuestions(
            (listingsRes.data || []).map(listingFromRemoteRow),
            [],
          ),
          // Merge-only: this pull is not a full catalog authority (public fiche / Fil refresh).
          mode: 'merge',
        }),
      )
    }
    if (!parcelsRes.error) {
      const remoteParcels = fromRows(parcelsRes.data || [])
      const localParcels = getState().parcels?.items || []
      const { mergeRemoteById } = await import('@moxt/shared/utils/mergeRemoteById.js')
      dispatch(setParcels({ items: mergeRemoteById(localParcels, remoteParcels) }))
    }
    if (!jobsRes.error) {
      dispatch(setJobs({ items: jobsFromRemoteRows(jobsRes.data || []), mode: 'merge' }))
    }
    if (!eventsRes.error) {
      dispatch(
        setEvents({
          items: fromRows(eventsRes.data || []).map(enrichEventFromRemoteRow),
          mode: 'merge',
        }),
      )
    }
    if (!videosRes.error) {
      dispatch(setVideos({ items: fromRows(videosRes.data || []), mode: 'merge' }))
    }
    if (!offersRes.error) {
      for (const row of offersRes.data || []) {
        const offer = p2pOfferFromRemoteRow(row)
        if (offer?.id) dispatch(receiveRemoteOffer(offer))
      }
    }
    if (!postsRes.error) {
      const remotePosts = fromRows(postsRes.data || [])
      const localPosts = getState().posts?.items || []
      const { mergeRemoteById } = await import('@moxt/shared/utils/mergeRemoteById.js')
      dispatch(setPosts({ items: mergeRemoteById(localPosts, remotePosts) }))
    }
    if (!businessesRes.error) {
      const remoteBiz = (businessesRes.data || []).map(businessFromRemoteRow).filter(Boolean)
      const localBiz = getState().businesses?.items || []
      const { mergeRemoteById } = await import('@moxt/shared/utils/mergeRemoteById.js')
      dispatch(setBusinesses({ items: mergeRemoteById(localBiz, remoteBiz) }))
    }
    return true
  },
)

/** Recharge les données publications à l’ouverture d’une page catalogue. */
export function useRefreshPublicationsData(scopeKey) {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(refreshPublicationsData())
  }, [dispatch, scopeKey])
}
