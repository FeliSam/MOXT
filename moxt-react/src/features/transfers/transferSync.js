import { createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../services/supabaseClient'
import { transferFromRemoteRow } from './transferRemote'
import { receiveRemoteTransfer } from './transferSlice'

/** Colonnes utiles au client (évite select *). */
export const TRANSFER_SELECT_COLUMNS = [
  'id',
  'user_id',
  'business_id',
  'business_owner_id',
  'status',
  'direction',
  'origin_country',
  'amount',
  'amount_sent',
  'amount_received',
  'fees',
  'total_to_pay',
  'currency_from',
  'currency_to',
  'fee_percent',
  'rate_margin_percent',
  'raw_rate',
  'timeline',
  'payment_proof',
  'business_proof',
  'sender',
  'recipient',
  'exchanger',
  'payload',
  'received_at',
  'received_method',
  'received_proof',
  'created_at',
  'updated_at',
].join(',')

let lastTransferRefreshAt = null

function applySinceFilter(query, sinceIso) {
  if (!sinceIso) return query
  return query.gte('updated_at', sinceIso)
}

/** Charge un transfert manquant (lien notification / autre appareil). */
export const ensureTransferFromRemote = createAsyncThunk(
  'transfers/ensureTransferFromRemote',
  async (transferId, { dispatch, getState }) => {
    if (!transferId || !supabase) return null
    const existing = getState().transfers.items.find((item) => item.id === transferId)
    if (existing) return existing

    const { data, error } = await supabase
      .from('transfers')
      .select(TRANSFER_SELECT_COLUMNS)
      .eq('id', transferId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const transfer = transferFromRemoteRow(data)
    dispatch(receiveRemoteTransfer(transfer))
    return transfer
  },
)

/**
 * Rafraîchit les transferts visibles.
 * Après le premier chargement, ne récupère que les lignes updated_at >= dernier refresh
 * (fenêtre −2 min pour absorber le skew horloge).
 */
export const refreshVisibleTransfers = createAsyncThunk(
  'transfers/refreshVisibleTransfers',
  async ({ userId, businessId, forceFull = false } = {}, { dispatch, getState }) => {
    if (!supabase || !userId) return []

    const existing = getState().transfers?.items || []
    const sinceIso =
      !forceFull && lastTransferRefreshAt && existing.length
        ? new Date(Math.max(0, new Date(lastTransferRefreshAt).getTime() - 120000)).toISOString()
        : null

    const buildQuery = (column, value) => {
      let query = supabase
        .from('transfers')
        .select(TRANSFER_SELECT_COLUMNS)
        .eq(column, value)
        .order('created_at', { ascending: false })
        .limit(80)
      return applySinceFilter(query, sinceIso)
    }

    const queries = [buildQuery('user_id', userId), buildQuery('business_owner_id', userId)]
    if (businessId) {
      queries.push(buildQuery('business_id', businessId))
    }

    const results = await Promise.all(queries)
    const byId = new Map()
    for (const res of results) {
      if (res.error) {
        console.warn('[MOXT] Refresh transferts:', res.error.message)
        continue
      }
      for (const row of res.data || []) {
        byId.set(row.id, transferFromRemoteRow(row))
      }
    }

    const transfers = [...byId.values()]
    for (const transfer of transfers) {
      dispatch(receiveRemoteTransfer(transfer))
    }
    lastTransferRefreshAt = new Date().toISOString()
    return transfers
  },
)

/** Remet le curseur incrémental (tests / déconnexion). */
export function resetTransferRefreshCursor() {
  lastTransferRefreshAt = null
}
