import { createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../services/supabaseClient'
import { fromRows } from '../../services/remoteRowMapper'
import { setAll as setStatuses } from './statusesSlice'
import {
  applySeenLedgerToStatuses,
  mergeStatusViewers,
  mergeViewedByLists,
} from './statusViewUtils'
import { readStatusRailCache, writeStatusRailCache } from './statusRailCache'

const STATUS_RAIL_COLUMNS =
  'id, author_id, author_name, author_avatar_url, business_id, images, viewed_by, created_at, expires_at, is_official'

function parseJsonField(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === 'object' && !Array.isArray(value))) {
    return value ?? fallback
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return fallback
}

function mapStatusRows(rows, localStatusesById) {
  return fromRows(rows || []).map((s) => {
    const remoteViewedBy = parseJsonField(s.viewedBy ?? s.viewed_by, [])
    const local = localStatusesById.get(s.id)
    return {
      ...s,
      images: parseJsonField(s.images, []).filter((url) => typeof url === 'string' && url).slice(0, 4),
      viewedBy: mergeViewedByLists(remoteViewedBy, local?.viewedBy),
      viewers: mergeStatusViewers(local?.viewers || {}, {}),
      reactions: local?.reactions || {},
      isOfficial: s.isOfficial === true || s.is_official === true,
    }
  })
}

/** Recharge léger des statuts (rail) — indépendant du mega loadAllData. */
export const refreshStatusesData = createAsyncThunk(
  'statuses/refreshStatusesData',
  async (_, { dispatch, getState, rejectWithValue }) => {
    if (!supabase) return rejectWithValue('Connexion indisponible')
    const uid = getState().auth.user?.id
    if (!uid) return null

    const cached = readStatusRailCache(uid)
    if (cached?.length) {
      dispatch(setStatuses({ items: applySeenLedgerToStatuses(cached, uid) }))
    }

    const { data, error } = await supabase
      .from('statuses')
      .select(STATUS_RAIL_COLUMNS)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) return rejectWithValue(error.message)

    const localStatusesById = new Map((getState().statuses?.items || []).map((item) => [item.id, item]))
    const mapped = mapStatusRows(data, localStatusesById)

    const hydrated = applySeenLedgerToStatuses(mapped, uid)
    dispatch(setStatuses({ items: hydrated }))
    writeStatusRailCache(uid, hydrated)
    return mapped.length
  },
)

export { mapStatusRows, STATUS_RAIL_COLUMNS }
