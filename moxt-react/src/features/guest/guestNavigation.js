const INVITE_STORAGE_KEY = 'moxt.pendingInviteCode'
const RETURN_TO_STORAGE_KEY = 'moxt.returnTo'

export function storePendingInviteCode(code) {
  const normalized = String(code || '').trim()
  if (!normalized) return
  try {
    sessionStorage.setItem(INVITE_STORAGE_KEY, normalized)
  } catch {
    // ignore storage failures
  }
}

export function readPendingInviteCode() {
  try {
    return sessionStorage.getItem(INVITE_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function clearPendingInviteCode() {
  try {
    sessionStorage.removeItem(INVITE_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function storeReturnTo(path) {
  const normalized = String(path || '').trim()
  if (!normalized || !normalized.startsWith('/')) return
  try {
    sessionStorage.setItem(RETURN_TO_STORAGE_KEY, normalized)
  } catch {
    // ignore
  }
}

export function readReturnTo() {
  try {
    return sessionStorage.getItem(RETURN_TO_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function clearReturnTo() {
  try {
    sessionStorage.removeItem(RETURN_TO_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function resolveReturnTo(searchParams, locationState) {
  const fromQuery = searchParams.get('returnTo')
  if (fromQuery && fromQuery.startsWith('/')) {
    return decodeURIComponent(fromQuery)
  }
  if (locationState?.from && String(locationState.from).startsWith('/')) {
    return locationState.from
  }
  const stored = readReturnTo()
  if (stored) return stored
  return '/dashboard'
}
