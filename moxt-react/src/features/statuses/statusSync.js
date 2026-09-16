import { createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../services/supabaseClient'
import { fromRows } from '../../services/remoteRowMapper'
import { setAll as setStatuses } from './statusesSlice'
import {
  applySeenLedgerToStatuses,
  mergeStatusViewers,
  mergeViewedByLists,
} from './statusViewUtils'
import {
  isStatusRailCacheFresh,
  readStatusRailCache,
  writeStatusRailCache,
} from './statusRailCache'

const STATUS_FETCH_TIMEOUT_MS = 4000

const STATUS_RAIL_COLUMNS =
  'id, author_id, author_name, author_avatar_url, business_id, images, viewed_by, created_at, expires_at, is_official'

/** Affiche le cache local immédiatement si le store est vide. */
export function hydrateStatusRailIfEmpty(getState, dispatch) {
  const uid = getState().auth.user?.id
  if (!uid || getState().statuses?.items?.length) return false
  const cached = readStatusRailCache(uid, { allowStale: true })
  if (!cached?.length) return false
  dispatch(setStatuses({ items: applySeenLedgerToStatuses(cached, uid) }))
  return true
}

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
let statusesRefreshInFlight = null

export const refreshStatusesData = createAsyncThunk(
  'statuses/refreshStatusesData',
  async ({ force = false } = {}, { dispatch, getState, rejectWithValue }) => {
    if (!supabase) return rejectWithValue('Connexion indisponible')
    const uid = getState().auth.user?.id
    if (!uid) return null

    hydrateStatusRailIfEmpty(getState, dispatch)

    if (!force && isStatusRailCacheFresh(uid) && getState().statuses?.items?.length) {
      return getState().statuses.items.length
    }

    if (statusesRefreshInFlight && !force) {
      try {
        return await statusesRefreshInFlight
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : String(error))
      }
    }

    const job = (async () => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
      const abortTimer = controller
        ? setTimeout(() => controller.abort(), STATUS_FETCH_TIMEOUT_MS)
        : null
      let query = supabase
        .from('statuses')
        .select(STATUS_RAIL_COLUMNS)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(60)
      if (controller) query = query.abortSignal(controller.signal)
      const { data, error } = await query
      if (abortTimer) clearTimeout(abortTimer)

      if (error) {
        const aborted =
          error?.name === 'AbortError' || /abort/i.test(String(error.message || ''))
        if (aborted) return getState().statuses?.items?.length || 0
        throw new Error(error.message)
      }

      const localStatusesById = new Map((getState().statuses?.items || []).map((item) => [item.id, item]))
      const mapped = mapStatusRows(data, localStatusesById)

      const hydrated = applySeenLedgerToStatuses(mapped, uid)
      dispatch(setStatuses({ items: hydrated }))
      writeStatusRailCache(uid, hydrated)
      return mapped.length
    })()

    statusesRefreshInFlight = job
    try {
      return await job
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : String(error))
    } finally {
      if (statusesRefreshInFlight === job) statusesRefreshInFlight = null
    }
  },
)

/** Cache immédiat + fetch réseau (login / bootstrap), sans attendre le rail. */
export function primeStatusRail(store) {
  hydrateStatusRailIfEmpty(store.getState, store.dispatch)
  const uid = store.getState()?.auth?.user?.id
  if (!uid) return Promise.resolve()
  return store.dispatch(refreshStatusesData())
}

export { mapStatusRows, STATUS_RAIL_COLUMNS }
