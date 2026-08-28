import { createAsyncThunk } from '@reduxjs/toolkit'
import { batch } from 'react-redux'
import { supabase } from '../../services/supabaseClient'
import { listingFromRemoteRow } from '../marketplace/marketplaceRemote'
import { businessFromRemoteRow } from '../businesses/businessRemote'
import { jobsFromRemoteRows } from '../jobs/jobRemote'
import { fromRows } from '../../services/remoteRowMapper'
import { setAll as setMarketplace } from '../marketplace/marketplaceSlice'
import { setAll as setParcels } from '../parcels/parcelSlice'
import { setAll as setJobs } from '../jobs/jobSlice'
import { setAll as setEvents } from '../events/eventSlice'
import { setAll as setVideos } from '../videos/videosSlice'
import { setAll as setPosts } from '../posts/postsSlice'
import { setAll as setBusinesses } from '../businesses/businessSlice'

const GUEST_FEED_LIMIT = 80

function safeRows(result, label) {
  if (result?.error) {
    console.warn(`[MOXT] Feed invité ${label}:`, result.error.message)
    return []
  }
  return result?.data || []
}

export async function fetchGuestFeedCatalog() {
  if (!supabase) {
    return {
      listings: [],
      parcels: [],
      jobs: [],
      events: [],
      posts: [],
      videos: [],
      businesses: [],
    }
  }

  const [listingsRes, parcelsRes, jobsRes, eventsRes, postsRes, videosRes, businessesRes] =
    await Promise.all([
      supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(GUEST_FEED_LIMIT),
      supabase
        .from('parcels')
        .select('*')
        .in('status', ['active', 'full'])
        .order('updated_at', { ascending: false })
        .limit(GUEST_FEED_LIMIT),
      supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(GUEST_FEED_LIMIT),
      supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(GUEST_FEED_LIMIT),
      supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(GUEST_FEED_LIMIT),
      supabase
        .from('videos')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(GUEST_FEED_LIMIT),
      supabase
        .from('businesses')
        .select('*')
        .in('status', ['verified', 'approved', 'active'])
        .order('updated_at', { ascending: false })
        .limit(GUEST_FEED_LIMIT),
    ])

  return {
    listings: safeRows(listingsRes, 'listings').map(listingFromRemoteRow).filter(Boolean),
    parcels: fromRows(safeRows(parcelsRes, 'parcels')),
    jobs: jobsFromRemoteRows(safeRows(jobsRes, 'jobs')),
    events: fromRows(safeRows(eventsRes, 'events')),
    posts: fromRows(safeRows(postsRes, 'posts')),
    videos: fromRows(safeRows(videosRes, 'videos')),
    businesses: safeRows(businessesRes, 'businesses').map(businessFromRemoteRow).filter(Boolean),
  }
}

export const loadGuestFeedCatalog = createAsyncThunk(
  'guest/loadFeedCatalog',
  async (_, { dispatch }) => {
    const catalog = await fetchGuestFeedCatalog()
    batch(() => {
      dispatch(setMarketplace({ items: catalog.listings }))
      dispatch(setParcels({ items: catalog.parcels }))
      dispatch(setJobs({ items: catalog.jobs }))
      dispatch(setEvents({ items: catalog.events }))
      dispatch(setPosts({ items: catalog.posts }))
      dispatch(setVideos({ items: catalog.videos }))
      dispatch(setBusinesses({ items: catalog.businesses }))
    })
    return catalog
  },
)
