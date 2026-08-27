const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])

function isLocalHarnessHost(hostname) {
  return LOCAL_HOSTS.has(String(hostname || ''))
}

function isE2eHarnessEnabled() {
  return typeof window !== 'undefined' && window.__MOXT_E2E__ === true && isLocalHarnessHost(window.location?.hostname)
}

/**
 * Session injectée par Playwright (`window.__MOXT_E2E_SESSION__`).
 * Active uniquement sur localhost — jamais en production.
 */
export function readE2eHarnessSession() {
  if (!isE2eHarnessEnabled()) return null
  const payload = window.__MOXT_E2E_SESSION__
  if (!payload?.user?.id) return null
  return {
    user: payload.user,
    token: payload.token || 'e2e-token',
  }
}

/** true = Playwright a pris la main : ne pas attendre Supabase. */
export function isE2eHarnessActive() {
  return isE2eHarnessEnabled()
}
