import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  canUserAccessTransfer,
  selectOwnedBusinessIds,
} from '../transferSelectors'
import { ensureTransferFromRemote } from '../transferSync'

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
    if (!transferId || !user?.id || transfer) return undefined
    const promise = dispatch(ensureTransferFromRemote(transferId))
    return () => {
      promise.abort?.()
    }
  }, [dispatch, transfer, transferId, user?.id])

  return { business: transferBusiness || ownedBusiness, transfer }
}
