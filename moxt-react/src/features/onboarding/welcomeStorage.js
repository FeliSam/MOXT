const SEEN_KEY_PREFIX = 'moxt-welcome-seen-'
const PENDING_KEY = 'moxt-pending-welcome'

export function markWelcomePending() {
  try {
    sessionStorage.setItem(PENDING_KEY, '1')
  } catch {
    // sessionStorage indisponible (mode privé strict)
  }
}

export function clearWelcomePending() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // ignore
  }
}

export function isWelcomePending() {
  try {
    return sessionStorage.getItem(PENDING_KEY) === '1'
  } catch {
    return false
  }
}

export function hasSeenWelcome(userId) {
  if (!userId) return true
  try {
    return localStorage.getItem(`${SEEN_KEY_PREFIX}${userId}`) === '1'
  } catch {
    return false
  }
}

export function markWelcomeSeen(userId) {
  if (!userId) return
  try {
    localStorage.setItem(`${SEEN_KEY_PREFIX}${userId}`, '1')
  } catch {
    // ignore
  }
  clearWelcomePending()
}
