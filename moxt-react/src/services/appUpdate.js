const UPDATE_CHECK_MS = 5 * 60 * 1000
const RELOAD_DELAY_MS = 2500

let reloadScheduled = false
let reloadTimer = null

export function shouldApplyUpdate(localBuildId, remoteBuildId) {
  if (!localBuildId || !remoteBuildId) return false
  return String(localBuildId) !== String(remoteBuildId)
}

export function getLocalBuildId() {
  return typeof __MOXT_BUILD_ID__ !== 'undefined' ? __MOXT_BUILD_ID__ : ''
}

/** Recharge l'app sans déconnexion (session Supabase conservée en localStorage). */
export function scheduleAppReload({ reload = () => window.location.reload(), delayMs = RELOAD_DELAY_MS } = {}) {
  if (reloadScheduled) return
  reloadScheduled = true

  const runReload = () => {
    if (reloadTimer) {
      clearTimeout(reloadTimer)
      reloadTimer = null
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

export async function fetchRemoteBuildId(fetchImpl = fetch) {
  const response = await fetchImpl(`/version.json?ts=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) return null
  const payload = await response.json()
  return payload?.buildId || null
}

export async function checkForAppUpdate({
  localBuildId = getLocalBuildId(),
  fetchImpl = fetch,
  onUpdate = () => scheduleAppReload(),
} = {}) {
  if (!localBuildId) return false
  const remoteBuildId = await fetchRemoteBuildId(fetchImpl)
  if (!shouldApplyUpdate(localBuildId, remoteBuildId)) return false
  onUpdate()
  return true
}

export function startAppUpdateWatcher({
  localBuildId = getLocalBuildId(),
  fetchImpl = fetch,
  onUpdate = () => scheduleAppReload(),
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
