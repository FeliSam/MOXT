import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../../services/supabaseClient'
import { p2pOfferFromRemoteRow, p2pOrderFromRemoteRow } from '../sync/entityRemote'
import { receiveRemoteOffer, receiveRemoteOrder, removeRemoteOrder } from './p2pSlice'
import { ensureP2pOrderFromRemote, refreshP2pData } from './p2pSync'

const FOCUS_REFRESH_MS = 25_000

/**
 * Garde la fiche commande P2P synchronisée : realtime ciblé + refresh focus/interval.
 */
export function useP2pOrderRealtime(orderId) {
  const dispatch = useDispatch()
  const userId = useSelector((state) => state.auth.user?.id)

  useEffect(() => {
    if (!orderId || !userId) return undefined

    const refresh = () => {
      void ensureP2pOrderFromRemote(orderId, { dispatch })
    }

    refresh()

    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refresh()
      }
    }

    const timer = setInterval(refresh, FOCUS_REFRESH_MS)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)

    let channel = null
    if (supabase) {
      channel = supabase
        .channel(`p2p-order:${orderId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'p2p_orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              const id = payload.old?.id
              if (id) dispatch(removeRemoteOrder(id))
              return
            }
            const order = p2pOrderFromRemoteRow(payload.new)
            if (order?.id) dispatch(receiveRemoteOrder(order))
          },
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'p2p_offers',
          },
          (payload) => {
            if (payload.eventType === 'DELETE') return
            const offer = p2pOfferFromRemoteRow(payload.new)
            if (offer?.id) dispatch(receiveRemoteOffer(offer))
          },
        )
        .subscribe()
    }

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
      if (channel && supabase) supabase.removeChannel(channel)
    }
  }, [dispatch, orderId, userId])
}

/** Catalogue P2P : refresh silencieux à l’ouverture / focus. */
export function useP2pCatalogRealtime() {
  const dispatch = useDispatch()
  const userId = useSelector((state) => state.auth.user?.id)

  useEffect(() => {
    if (!userId) return undefined

    const refresh = () => {
      void dispatch(refreshP2pData())
    }

    refresh()

    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refresh()
      }
    }

    const timer = setInterval(refresh, FOCUS_REFRESH_MS)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [dispatch, userId])
}
