import { createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../services/supabaseClient'
import { fromRows } from '../../services/remoteRowMapper'
import { setAll as setStatuses } from './statusesSlice'
import {
  applySeenLedgerToStatuses,
  mergeStatusViewers,
  mergeViewedByLists,
} from './statusViewUtils'

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

/** Recharge léger des statuts (rail) — indépendant du mega loadAllData. */
export const refreshStatusesData = createAsyncThunk(
  'statuses/refreshStatusesData',
  async (_, { dispatch, getState, rejectWithValue }) => {
    if (!supabase) return rejectWithValue('Connexion indisponible')
    const uid = getState().auth.user?.id
    if (!uid) return null

    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) return rejectWithValue(error.message)

    const localStatusesById = new Map((getState().statuses?.items || []).map((item) => [item.id, item]))
    const mapped = fromRows(data || []).map((s) => {
      const remoteViewedBy = parseJsonField(s.viewedBy ?? s.viewed_by, [])
      const remoteViewers = parseJsonField(s.viewers, {})
      const local = localStatusesById.get(s.id)
      return {
        ...s,
        images: parseJsonField(s.images, []).filter((url) => typeof url === 'string' && url).slice(0, 4),
        viewedBy: mergeViewedByLists(remoteViewedBy, local?.viewedBy),
        viewers: mergeStatusViewers(remoteViewers, local?.viewers),
        reactions: parseJsonField(s.reactions, {}),
        isOfficial: s.isOfficial === true || s.is_official === true,
      }
    })

    dispatch(setStatuses({ items: applySeenLedgerToStatuses(mapped, uid) }))
    return mapped.length
  },
)
