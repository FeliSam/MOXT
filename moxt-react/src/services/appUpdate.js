const UPDATE_CHECK_MS = 10 * 60 * 1000
const RELOAD_DELAY_MS = 1500
const UPDATE_TARGET_KEY = 'moxt.pendingUpdateBuildId'
const UPDATE_ATTEMPTS_KEY = 'moxt.updateReloadAttempts'
const UPDATE_STUCK_KEY = 'moxt.updateStuckNotified'
/** Évite une boucle toast + reload si le CDN / le cache sert encore l’ancien bundle. */
export const MAX_UPDATE_RELOADS = 2

let reloadScheduled = false
let reloadTimer = null
let reloadCallbacks = new Set()

function readSession(key) {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null
  } catch {
    return null
  }
}

function writeSession(key, value) {
  try {
    sessionStorage?.setItem(key, value)
  } catch {
    // ignore
  }
}

export function clearUpdateReloadGuard() {
  try {
    sessionStorage?.removeItem(UPDATE_TARGET_KEY)
    sessionStorage?.removeItem(UPDATE_ATTEMPTS_KEY)
    sessionStorage?.removeItem(UPDATE_STUCK_KEY)
  } catch {
    // ignore
  }
}

export function isUpdateReloadBlocked(remoteBuildId) {
  const pending = readSession(UPDATE_TARGET_KEY)
  if (pending !== String(remoteBuildId)) return false
  return Number(readSession(UPDATE_ATTEMPTS_KEY) || 0) >= MAX_UPDATE_RELOADS
}

export function recordUpdateReloadAttempt(remoteBuildId) {
  const remote = String(remoteBuildId)
  const pending = readSession(UPDATE_TARGET_KEY)
  const attempts = pending === remote ? Number(readSession(UPDATE_ATTEMPTS_KEY) || 0) + 1 : 1
  writeSession(UPDATE_TARGET_KEY, remote)
  writeSession(UPDATE_ATTEMPTS_KEY, String(attempts))
}

export function markUpdateStuckNotified() {
  writeSession(UPDATE_STUCK_KEY, '1')
  return true
}

export function wasUpdateStuckNotified() {
  return readSession(UPDATE_STUCK_KEY) === '1'
}

/** Rechargement dur — évite le bfcache qui peut restaurer l’ancienne version. */
export function hardReload() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('_moxt', Date.now().toString(36))
  window.location.replace(url.toString())
}

export function shouldApplyUpdate(localBuildId, remoteBuildId) {
  if (!localBuildId || !remoteBuildId) return false
  return String(localBuildId) !== String(remoteBuildId)
}

export function getLocalBuildId() {
  return typeof __MOXT_BUILD_ID__ !== 'undefined' ? __MOXT_BUILD_ID__ : ''
}

export function onAppReload(callback) {
  reloadCallbacks.add(callback)
  return () => reloadCallbacks.delete(callback)
}

function notifyReloadPending() {
  for (const callback of reloadCallbacks) {
    try {
      callback()
    } catch {
      // ignore listener errors
    }
  }
}

/** Recharge l'app sans déconnexion (session Supabase conservée en localStorage). */
export function scheduleAppReload({
  reload = hardReload,
  delayMs = RELOAD_DELAY_MS,
  reason = 'release',
} = {}) {
  if (reloadScheduled) return
  reloadScheduled = true
  notifyReloadPending()

  const runReload = () => {
    if (reloadTimer) {
      clearTimeout(reloadTimer)
      reloadTimer = null
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('moxt.lastReloadReason', reason)
      } catch {
        // ignore
      }
    }
    reload()
  }

  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    runReload()
    return
  }

  if (typeof document !== 'undefined') {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') {
        document.removeEventListener('visibilitychange', onHidden)
        runReload()
      }
    }
    document.addEventListener('visibilitychange', onHidden)
  }

  reloadTimer = setTimeout(runReload, delayMs)
}

export async function fetchRemoteRelease(fetchImpl = fetch) {
  const response = await fetchImpl(`/version.json?ts=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) return null
  const payload = await response.json()
  if (!payload?.buildId) return null
  return {
    buildId: String(payload.buildId),
    builtAt: payload.builtAt || null,
    swCacheId: payload.swCacheId || null,
    channel: payload.channel || 'production',
  }
}

export async function fetchRemoteBuildId(fetchImpl = fetch) {
  const release = await fetchRemoteRelease(fetchImpl)
  return release?.buildId || null
}

export async function checkForAppUpdate({
  localBuildId = getLocalBuildId(),
  fetchImpl = fetch,
  onUpdate = () => scheduleAppReload({ reason: 'version-json' }),
  onBlocked = () => {},
} = {}) {
  if (!localBuildId) return false
  const release = await fetchRemoteRelease(fetchImpl)
  if (!release) return false
  if (!shouldApplyUpdate(localBuildId, release.buildId)) {
    clearUpdateReloadGuard()
    return false
  }
  if (isUpdateReloadBlocked(release.buildId)) {
    onBlocked(release)
    return false
  }
  recordUpdateReloadAttempt(release.buildId)
  onUpdate(release)
  return true
}

export function startAppUpdateWatcher({
  localBuildId = getLocalBuildId(),
  fetchImpl = fetch,
  onUpdate = () => scheduleAppReload({ reason: 'version-json' }),
  onBlocked = () => {},
  intervalMs = UPDATE_CHECK_MS,
  setIntervalFn = setInterval,
  documentRef = typeof document !== 'undefined' ? document : null,
} = {}) {
  if (!localBuildId) return () => {}

  const runCheck = () => {
    void checkForAppUpdate({ localBuildId, fetchImpl, onUpdate, onBlocked })
  }

  runCheck()

  const intervalId = setIntervalFn(runCheck, intervalMs)
  const onVisible = () => {
    if (documentRef?.visibilityState === 'visible') runCheck()
  }

  documentRef?.addEventListener('visibilitychange', onVisible)

  return () => {
    clearInterval(intervalId)
    documentRef?.removeEventListener('visibilitychange', onVisible)
    if (reloadTimer) clearTimeout(reloadTimer)
  }
}
