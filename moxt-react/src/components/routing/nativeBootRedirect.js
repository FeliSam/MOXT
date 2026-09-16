function isNativeHomePath(pathname) {
  return pathname === '/' || pathname === '/index.html'
}

/** Native cold start lands on `/` (public marketing). Logged-in users want the app shell. */
export function shouldRedirectNativeHome({ native, pathname, userId, status } = {}) {
  if (!native) return false
  if (status === 'loading') return false
  if (!userId) return false
  return isNativeHomePath(pathname)
}

export function shouldHoldNativeHomeForAuth({ native, pathname, status } = {}) {
  return Boolean(native && status === 'loading' && isNativeHomePath(pathname))
}
