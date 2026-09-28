import { createAsyncThunk } from '@reduxjs/toolkit'

import { fromRows } from '../utils/remoteRowMapper.js'
import { transfersFromRemoteRows } from '../domain/transferRemote.js'
import { PARCELS_PUBLIC_LIMIT, USER_ROWS_LIMIT } from '../services/parcelsService.js'

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
        .or(`user_id.eq.${uid},business_owner_id.eq.${uid}`)
        .order('created_at', { ascending: false }),
      // Même fenêtre que le web : les onglets Colis (actifs / archives) comptent sur ces trajets.
      supabase.from('parcels').select('*').order('created_at', { ascending: false }).limit(PARCELS_PUBLIC_LIMIT),
      supabase.from('parcel_requests').select('*').eq('user_id', uid).limit(USER_ROWS_LIMIT),
    ])

    assertLoaded(transfersRes, 'des transferts')
    assertLoaded(parcelsRes, 'des colis')
    assertLoaded(parcelRequestsRes, 'des demandes colis')

    // Même mapping que le web (payload fusionné, tarification, exchanger).
    dispatch(setTransfers({ items: transfersFromRemoteRows(transfersRes.data || []) }))
    dispatch(
      setParcels({
        items: fromRows(parcelsRes.data),
        requests: fromRows(parcelRequestsRes.data),
      }),
    )
  })
}
