/** Soft remount / auth retry when splash stays open too long. */
export const LOADING_STUCK_MS = 5000
export const MAX_SOFT_LOADING_RETRIES = 3

let softRetryCount = 0

export function getSoftLoadingRetryCount() {
  return softRetryCount
}

export function resetSoftLoadingRetryCount() {
  softRetryCount = 0
}

/** @returns {'soft' | 'hard' | 'none'} */
export function nextLoadingRetryKind() {
  if (softRetryCount < MAX_SOFT_LOADING_RETRIES) {
    softRetryCount += 1
    return 'soft'
  }
  if (softRetryCount === MAX_SOFT_LOADING_RETRIES) {
    softRetryCount += 1
    return 'hard'
  }
  return 'none'
}

/**
 * Re-triggers session restore (+ data load when a user is present).
 * @param {{ dispatch: Function, getState: Function }} store
 */
export async function retryAuthAndDataLoad({ dispatch, getState }) {
  const { restoreSession } = await import('../../features/auth/authSlice')
  await dispatch(restoreSession())
  const user = getState()?.auth?.user
  if (!user) return
  const { loadAllData } = await import('../../app/loadAllData')
  dispatch(loadAllData())
}
