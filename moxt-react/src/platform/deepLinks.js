import { resolveDeepLinkDestination } from '../features/guest/guestNavigation'

/** @type {import('react-router-dom').NavigateFunction | null} */
let navigateRef = null
/** @type {(() => { id?: string } | null) | null} */
let readAuthUserRef = null
/** @type {import('@reduxjs/toolkit').Store | null} */
let storeRef = null

export function setDeepLinkNavigator(navigate) {
  navigateRef = navigate
}

export function setDeepLinkAuthReader(readAuthUser) {
  readAuthUserRef = readAuthUser
}

export function setDeepLinkStore(store) {
  storeRef = store
}

function waitForAuthUser(timeoutMs = 5000) {
  if (!storeRef) {
    return Promise.resolve(readAuthUserRef?.() ?? null)
  }

  const readUser = () => storeRef.getState().auth.user
  const readStatus = () => storeRef.getState().auth.status

  if (readStatus() !== 'loading') {
    return Promise.resolve(readUser())
  }

  return new Promise((resolve) => {
    const started = Date.now()
    const unsubscribe = storeRef.subscribe(() => {
      if (readStatus() !== 'loading' || Date.now() - started > timeoutMs) {
        unsubscribe()
        resolve(readUser())
      }
    })
    setTimeout(() => {
      unsubscribe()
      resolve(readUser())
    }, timeoutMs)
  })
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

export async function navigateDeepLink(url) {
  const path = parseDeepLinkPath(url)
  if (!path || !navigateRef) return false

  const user = await waitForAuthUser()
  const destination = resolveDeepLinkDestination(path, user)
  navigateRef(destination)
  return true
}
