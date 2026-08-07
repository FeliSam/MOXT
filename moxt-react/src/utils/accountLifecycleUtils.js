const MS_DAY = 24 * 60 * 60 * 1000
const MS_HOUR = 60 * 60 * 1000

export function parseLifecycleDate(value) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

export function formatCountdown(targetIso, { now = Date.now() } = {}) {
  const target = parseLifecycleDate(targetIso)
  if (!target) return null
  const diff = Math.max(0, target - now)
  const days = Math.floor(diff / MS_DAY)
  const hours = Math.floor((diff % MS_DAY) / MS_HOUR)
  const minutes = Math.floor((diff % MS_HOUR) / 60000)
  if (days > 0) return { days, hours, minutes, totalMs: diff, expired: diff <= 0 }
  return { days: 0, hours, minutes, totalMs: diff, expired: diff <= 0 }
}

export function isDeletionCoolingOff(deletionRequest, { now = Date.now() } = {}) {
  if (!deletionRequest || deletionRequest.status !== 'requested') return false
  const suspendAt = parseLifecycleDate(deletionRequest.suspendAt || deletionRequest.suspend_at)
  if (!suspendAt) return true
  return now < suspendAt
}

export function canCancelDeletion(deletionRequest, { now = Date.now() } = {}) {
  return isDeletionCoolingOff(deletionRequest, { now })
}

export function resolveAccountStatusContext(user, deletionRequest) {
  const suspended = user?.status === 'suspended'
  const coolingOff = isDeletionCoolingOff(deletionRequest)
  const source = user?.suspensionSource || (coolingOff ? 'deletion_pending' : suspended ? 'admin' : 'active')
  const purgeAt = user?.purgeAt || deletionRequest?.purgeAt || deletionRequest?.purge_at || null
  const suspendAt = deletionRequest?.suspendAt || deletionRequest?.suspend_at || null
  const reopenRequested = Boolean(user?.reopenRequestedAt || deletionRequest?.reopenRequestedAt)

  return {
    suspended,
    coolingOff,
    source,
    purgeAt,
    suspendAt,
    reopenRequested,
  }
}
