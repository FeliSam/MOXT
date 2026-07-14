import { useCallback, useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import { MoxtLoadingScreen } from './MoxtLoadingScreen'
import {
  nextLoadingRetryKind,
  resetSoftLoadingRetryCount,
  retryAuthAndDataLoad,
} from './loadingRetry'

/**
 * Splash shown while `auth.status === 'loading'`. After 5s, soft-retries
 * session restore (+ data), then one hard reload if still stuck.
 */
export function AuthLoadingScreen() {
  const store = useStore()
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    return () => {
      resetSoftLoadingRetryCount()
    }
  }, [])

  const handleStuck = useCallback(() => {
    const kind = nextLoadingRetryKind()
    if (kind === 'none') return
    if (kind === 'hard') {
      window.location.reload()
      return
    }
    void retryAuthAndDataLoad(store).finally(() => {
      setEpoch((value) => value + 1)
    })
  }, [store])

  return <MoxtLoadingScreen key={epoch} autoRetry onStuck={handleStuck} />
}
