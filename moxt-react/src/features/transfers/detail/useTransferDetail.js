import { useSelector } from 'react-redux'
import {
  canUserAccessTransfer,
  selectOwnedBusinessIds,
} from '../transferSelectors'

export function useTransferDetail(transferId, user) {
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

  return { business: transferBusiness || ownedBusiness, transfer }
}
