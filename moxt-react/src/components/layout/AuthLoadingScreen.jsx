import { useCallback, useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import { AppLoadingFallback } from './AppLoadingFallback'
import { markBootSplashConsumed, shouldShowBootSplash } from './bootSplash'
import { MoxtLoadingScreen } from './MoxtLoadingScreen'
import {
  nextLoadingRetryKind,
  resetSoftLoadingRetryCount,
  retryAuthAndDataLoad,
} from './loadingRetry'

/**
 * Auth restore wait. Brand splash only on cold boot; later waits use a spinner.
 */
export function AuthLoadingScreen() {
  const store = useStore()
  const [epoch, setEpoch] = useState(0)
  const [useSplash] = useState(() => shouldShowBootSplash())

  useEffect(() => {
    return () => {
      markBootSplashConsumed()
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

  if (!useSplash) {
    return <AppLoadingFallback />
  }

  return <MoxtLoadingScreen key={epoch} autoRetry onStuck={handleStuck} />
}
