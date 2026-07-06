/** @type {import('react-router-dom').NavigateFunction | null} */
let navigateRef = null

export function setDeepLinkNavigator(navigate) {
  navigateRef = navigate
}

/**
 * Convertit une URL native (moxt://, com.moxt.app://, https://…) en chemin React Router.
 * @param {string} url
 * @returns {string | null}
 */
export function parseDeepLinkPath(url) {
  if (!url) return null

  try {
    const parsed = new URL(url)

    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`
      if (path === '/' || path === '/index.html') return null
      return path
    }

    // Schémas custom : com.moxt.app://transfers/1 ou moxt://app/dashboard
    const host = parsed.hostname || parsed.host || ''
    const pathname = parsed.pathname || ''

    if (host === 'app' || host === 'localhost') {
      if (pathname && pathname !== '/') return pathname
      return '/dashboard'
    }

    const combined = pathname && pathname !== '/' ? `/${host}${pathname}` : `/${host}`
    return combined.replace(/\/{2,}/g, '/')
  } catch {
    const trimmed = url.trim()
    if (trimmed.startsWith('/')) return trimmed
    return null
  }
}

export function navigateDeepLink(url) {
  const path = parseDeepLinkPath(url)
  if (!path || !navigateRef) return false
  navigateRef(path)
  return true
}
