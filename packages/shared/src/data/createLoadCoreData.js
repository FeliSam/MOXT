import { createAsyncThunk } from '@reduxjs/toolkit'

import { fromRows } from '../utils/remoteRowMapper.js'

function assertLoaded(result, label) {
  if (result.error) {
    throw new Error(`Chargement ${label} impossible : ${result.error.message}`)
  }
  return result.data || []
}

export function createLoadCoreData({ supabase, setTransfers, setParcels }) {
  return createAsyncThunk('app/loadCoreData', async (_, { getState, dispatch }) => {
    const { user } = getState().auth
    if (!user) return

    const uid = user.id

    const [transfersRes, parcelsRes, parcelRequestsRes] = await Promise.all([
      supabase
        .from('transfers')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }),
      supabase.from('parcels').select('*').order('created_at', { ascending: false }),
      supabase.from('parcel_requests').select('*').eq('user_id', uid),
    ])

    assertLoaded(transfersRes, 'des transferts')
    assertLoaded(parcelsRes, 'des colis')
    assertLoaded(parcelRequestsRes, 'des demandes colis')

    dispatch(setTransfers({ items: fromRows(transfersRes.data) }))
    dispatch(
      setParcels({
        items: fromRows(parcelsRes.data),
        requests: fromRows(parcelRequestsRes.data),
      }),
    )
  })
}
