import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  canUserAccessTransfer,
  selectOwnedBusinessIds,
} from '../transferSelectors'
import { ensureTransferFromRemote } from '../transferSync'
import { supabase } from '../../../services/supabaseClient'
import { transferFromRemoteRow } from '../transferRemote'
import { receiveRemoteTransfer } from '../transferSlice'

const REFRESH_MS = 12_000

export function useTransferDetail(transferId, user) {
  const dispatch = useDispatch()
  const ownedBusinessIds = useSelector((state) => selectOwnedBusinessIds(state, user?.id))
  const transfer = useSelector((state) => {
    const item = state.transfers.items.find((entry) => entry.id === transferId)
    return canUserAccessTransfer(item, user, ownedBusinessIds) ? item : null
  })
  const ownedBusiness = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user?.id),
  )
  const transferBusiness = useSelector((state) =>
    transfer?.businessId
      ? state.businesses.items.find((item) => item.id === transfer.businessId)
      : null,
  )

  useEffect(() => {
    if (!transferId || !user?.id) return undefined
    const promise = dispatch(ensureTransferFromRemote(transferId))
    return () => {
      promise.abort?.()
    }
  }, [dispatch, transferId, user?.id])

  // Rafraîchissement périodique + focus : les actions de l'autre partie
  // s'appliquent sans quitter la page (complément au realtime global).
  useEffect(() => {
    if (!transferId || !user?.id) return undefined

    const refresh = () => {
      void dispatch(ensureTransferFromRemote(transferId))
    }

    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refresh()
      }
    }

    const timer = setInterval(refresh, REFRESH_MS)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)

    let channel = null
    if (supabase) {
      channel = supabase
        .channel(`transfer-detail:${transferId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transfers',
            filter: `id=eq.${transferId}`,
          },
          (payload) => {
            const remote = transferFromRemoteRow(payload.new || payload.old)
            if (!remote?.id) return
            if (!canUserAccessTransfer(remote, user, ownedBusinessIds)) return
            dispatch(receiveRemoteTransfer(remote))
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
  }, [dispatch, ownedBusinessIds, transferId, user])

  return { business: transferBusiness || ownedBusiness, transfer }
}
