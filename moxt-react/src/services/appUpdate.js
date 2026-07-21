const UPDATE_CHECK_MS = 10 * 60 * 1000
const RELOAD_DELAY_MS = 1500

let reloadScheduled = false
let reloadTimer = null
let reloadCallbacks = new Set()

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
  reload = () => window.location.reload(),
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
} = {}) {
  if (!localBuildId) return false
  const release = await fetchRemoteRelease(fetchImpl)
  if (!release) return false
  if (!shouldApplyUpdate(localBuildId, release.buildId)) return false
  onUpdate(release)
  return true
}

export function startAppUpdateWatcher({
  localBuildId = getLocalBuildId(),
  fetchImpl = fetch,
  onUpdate = () => scheduleAppReload({ reason: 'version-json' }),
  intervalMs = UPDATE_CHECK_MS,
  setIntervalFn = setInterval,
  documentRef = typeof document !== 'undefined' ? document : null,
} = {}) {
  if (!localBuildId) return () => {}

  const runCheck = () => {
    void checkForAppUpdate({ localBuildId, fetchImpl, onUpdate })
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
