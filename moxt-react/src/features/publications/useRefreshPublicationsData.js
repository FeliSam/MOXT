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
import { setAll as setP2P } from '../p2p/p2pSlice'
import { jobsFromRemoteRows } from '../jobs/jobRemote'

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

    const [listingsRes, parcelsRes, jobsRes, eventsRes, offersRes] = await Promise.all([
      supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PUBLIC_LIMIT),
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
        .from('p2p_offers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PUBLIC_LIMIT),
    ])

    if (!listingsRes.error) {
      dispatch(
        setMarketplace({
          items: mergeListingQuestions(
            (listingsRes.data || []).map(listingFromRemoteRow),
            [],
          ),
        }),
      )
    }
    if (!parcelsRes.error) {
      dispatch(setParcels({ items: fromRows(parcelsRes.data || []) }))
    }
    if (!jobsRes.error) {
      dispatch(setJobs({ items: jobsFromRemoteRows(jobsRes.data || []) }))
    }
    if (!eventsRes.error) {
      dispatch(
        setEvents({
          items: fromRows(eventsRes.data || []).map(enrichEventFromRemoteRow),
        }),
      )
    }
    if (!offersRes.error) {
      dispatch(setP2P({ offers: fromRows(offersRes.data || []) }))
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
