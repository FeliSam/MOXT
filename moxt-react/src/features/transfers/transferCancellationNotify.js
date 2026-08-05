import { appText } from '../../i18n/appText'

function displayName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

/** Libellé humain de l'auteur d'une annulation de transfert (notification). */
export function resolveTransferCancellationActorLabel(store, transfer, actorId) {
  if (!actorId) return appText('notificationsFeed.someone')

  if (actorId === transfer.userId) {
    const name = displayName(transfer.sender?.firstName, transfer.sender?.lastName)
    return name || appText('notificationsFeed.transferCancelledActorClient')
  }

  if (actorId === transfer.businessOwnerId) {
    return transfer.exchanger?.name || appText('notificationsFeed.transferCancelledActorBusiness')
  }

  const state = store.getState()
  const authUser = state.auth.user
  if (authUser?.id === actorId) {
    const name = displayName(authUser.firstName, authUser.lastName)
    if (name) return name
  }

  const adminUser = state.administration?.users?.find((item) => item.id === actorId)
  if (adminUser) {
    const name = displayName(adminUser.firstName, adminUser.lastName)
    if (name) return name
  }

  return appText('notificationsFeed.transferCancelledActorStaff')
}

export function transferCancelledNotificationMessage(store, transfer, actorId) {
  const by = resolveTransferCancellationActorLabel(store, transfer, actorId)
  return appText('notificationsFeed.transferCancelledBody', { id: transfer.id, by })
}
