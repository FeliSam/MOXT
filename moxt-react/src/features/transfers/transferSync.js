import { createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../services/supabaseClient'
import { transferFromRemoteRow } from './transferRemote'
import { receiveRemoteTransfer, receiveRemoteTransfers } from './transferSlice'

/**
 * Colonnes réelles de public.transfers.
 * Les montants détaillés (amountSent, devises, etc.) vivent dans `payload` jsonb.
 */
export const TRANSFER_SELECT_COLUMNS = [
  'id',
  'user_id',
  'business_id',
  'business_owner_id',
  'status',
  'direction',
  'origin_country',
  'amount',
  'fee',
  'received_amount',
  'rate',
  'rate_date',
  'rate_source',
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
  'payment_deadline_at',
].join(',')

/** Liste dashboard / historique : sans preuves lourdes. */
export const TRANSFER_LIST_COLUMNS = [
  'id',
  'user_id',
  'business_id',
  'business_owner_id',
  'status',
  'direction',
  'origin_country',
  'amount',
  'fee',
  'received_amount',
  'rate',
  'rate_date',
  'rate_source',
  'timeline',
  'sender',
  'recipient',
  'exchanger',
  'payload',
  'created_at',
  'updated_at',
  'payment_deadline_at',
].join(',')

let lastTransferRefreshAt = null

function applySinceFilter(query, sinceIso) {
  if (!sinceIso) return query
  return query.gte('updated_at', sinceIso)
}

function isAbortError(error) {
  if (!error) return false
  if (error.name === 'AbortError') return true
  return /aborted/i.test(String(error.message || error))
}

/** Charge un transfert manquant (lien notification / autre appareil). */
export const ensureTransferFromRemote = createAsyncThunk(
  'transfers/ensureTransferFromRemote',
  async (transferId, { dispatch, getState, signal }) => {
    if (!transferId || !supabase) return null
    if (signal?.aborted) return null

    const existing = getState().transfers.items.find((item) => item.id === transferId)
    if (existing) return existing

    const { data, error } = await supabase
      .from('transfers')
      .select(TRANSFER_SELECT_COLUMNS)
      .eq('id', transferId)
      .maybeSingle()

    if (signal?.aborted) return null
    if (error) {
      if (isAbortError(error)) return null
      throw error
    }
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
 *
 * Options :
 * - scope: 'business' + businessId → une seule requête légère (dashboard échangeur)
 * - light: true → colonnes liste (sans preuves)
 */
export const refreshVisibleTransfers = createAsyncThunk(
  'transfers/refreshVisibleTransfers',
  async (
    { userId, businessId, forceFull = false, scope = 'all', light = false } = {},
    { dispatch, getState, signal },
  ) => {
    if (!supabase || !userId) return []
    if (signal?.aborted) return []

    const existing = getState().transfers?.items || []
    const sinceIso =
      !forceFull && lastTransferRefreshAt && existing.length
        ? new Date(Math.max(0, new Date(lastTransferRefreshAt).getTime() - 120000)).toISOString()
        : null

    const role = getState().auth?.user?.role
    const isStaff = ['moderator', 'admin', 'superadmin'].includes(role)
    const columns = light || scope === 'business' ? TRANSFER_LIST_COLUMNS : TRANSFER_SELECT_COLUMNS

    const buildQuery = (column, value, limit = 80) => {
      let query = supabase
        .from('transfers')
        .select(columns)
        .eq(column, value)
        .order('created_at', { ascending: false })
        .limit(limit)
      return applySinceFilter(query, sinceIso)
    }

    let queries
    if (scope === 'business' && businessId) {
      queries = [buildQuery('business_id', businessId, 120)]
    } else if (isStaff) {
      queries = [
        applySinceFilter(
          supabase
            .from('transfers')
            .select(columns)
            .order('created_at', { ascending: false })
            .limit(200),
          sinceIso,
        ),
      ]
    } else {
      queries = [buildQuery('user_id', userId), buildQuery('business_owner_id', userId)]
      if (businessId) queries.push(buildQuery('business_id', businessId))
    }

    const results = await Promise.all(queries)
    if (signal?.aborted) return []

    const byId = new Map()
    let hardError = null
    for (const res of results) {
      if (res.error) {
        if (isAbortError(res.error)) continue
        console.warn('[MOXT] Refresh transferts:', res.error.message)
        hardError = res.error
        continue
      }
      for (const row of res.data || []) {
        byId.set(row.id, transferFromRemoteRow(row))
      }
    }

    // Si toutes les requêtes ont échoué (hors abort), remonter l'erreur.
    if (!byId.size && hardError && results.every((res) => res.error)) {
      throw hardError
    }

    const transfers = [...byId.values()]
    if (transfers.length) {
      dispatch(receiveRemoteTransfers(transfers))
    }
    lastTransferRefreshAt = new Date().toISOString()
    return transfers
  },
)

/** Remet le curseur incrémental (tests / déconnexion). */
export function resetTransferRefreshCursor() {
  lastTransferRefreshAt = null
}
