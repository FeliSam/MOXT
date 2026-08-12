import { acceptTransferRequest, declineTransferRequest } from './transferSlice'

export function dispatchTransferAcceptanceAction(
  dispatch,
  getState,
  { transferId, actorId, actorRole, action, note },
) {
  const before = getState().transfers?.items?.find((item) => item.id === transferId)
  if (!before) return { applied: false, reason: 'not_found' }

  const prevStatus = before.status
  if (action === 'accept') {
    dispatch(acceptTransferRequest({ id: transferId, actorId, actorRole }))
  } else {
    dispatch(
      declineTransferRequest({
        id: transferId,
        actorId,
        actorRole,
        note: note || 'business_declined',
      }),
    )
  }

  const after = getState().transfers?.items?.find((item) => item.id === transferId)
  return {
    applied: after?.status !== prevStatus,
    prevStatus,
    nextStatus: after?.status,
  }
}
