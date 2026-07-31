import { createAsyncThunk } from '@reduxjs/toolkit'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'
import { supabase } from '../../services/supabaseClient'
import {
  p2pOfferFromRemoteRow,
  p2pOrderFromRemoteRow,
} from '../sync/entityRemote'
import { receiveRemoteOffer, receiveRemoteOrder, setAll } from './p2pSlice'

const PUBLIC_LIMIT = 80
const ORDER_LIMIT = 80

function isStaffRole(role) {
  return ['moderator', 'admin', 'superadmin'].includes(role)
}

/** Recharge offres + commandes P2P (merge) — filet de sécurité hors realtime. */
export const refreshP2pData = createAsyncThunk(
  'p2p/refreshP2pData',
  async (_, { dispatch, getState, rejectWithValue }) => {
    if (!supabase) return rejectWithValue('Connexion indisponible')
    const state = getState()
    const uid = state.auth.user?.id
    if (!uid) return null
    const staff = isStaffRole(state.auth.user?.role)

    const offersQuery = supabase
      .from('p2p_offers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PUBLIC_LIMIT)

    const ordersQuery = staff
      ? supabase.from('p2p_orders').select('*').order('created_at', { ascending: false }).limit(ORDER_LIMIT)
      : supabase
          .from('p2p_orders')
          .select('*')
          .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
          .order('created_at', { ascending: false })
          .limit(ORDER_LIMIT)

    const [offersRes, ordersRes] = await Promise.all([offersQuery, ordersQuery])
    if (offersRes.error && ordersRes.error) {
      return rejectWithValue(offersRes.error.message || ordersRes.error.message)
    }

    const remoteOffers = (offersRes.data || []).map(p2pOfferFromRemoteRow).filter((item) => item?.id)
    const remoteOrders = (ordersRes.data || []).map(p2pOrderFromRemoteRow).filter((item) => item?.id)

    dispatch(
      setAll({
        offers: mergeRemoteById(state.p2p.offers || [], remoteOffers),
        orders: mergeRemoteById(state.p2p.orders || [], remoteOrders),
      }),
    )
    return true
  },
)

/** Charge une commande précise depuis Supabase (détail / focus). */
export async function ensureP2pOrderFromRemote(orderId, { dispatch }) {
  if (!supabase || !orderId) return null
  const { data, error } = await supabase.from('p2p_orders').select('*').eq('id', orderId).maybeSingle()
  if (error || !data) return null
  const order = p2pOrderFromRemoteRow(data)
  if (order?.id) dispatch(receiveRemoteOrder(order))
  if (order?.offerId) {
    const { data: offerRow } = await supabase
      .from('p2p_offers')
      .select('*')
      .eq('id', order.offerId)
      .maybeSingle()
    const offer = p2pOfferFromRemoteRow(offerRow)
    if (offer?.id) dispatch(receiveRemoteOffer(offer))
  }
  return order
}
