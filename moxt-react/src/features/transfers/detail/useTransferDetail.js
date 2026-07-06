import { useSelector } from 'react-redux'

export function useTransferDetail(transferId, user) {
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const transfer = useSelector((state) =>
    state.transfers.items.find(
      (item) =>
        item.id === transferId &&
        (item.userId === user.id ||
          item.businessId === business?.id ||
          ['admin', 'superadmin'].includes(user.role)),
    ),
  )

  return { business, transfer }
}
