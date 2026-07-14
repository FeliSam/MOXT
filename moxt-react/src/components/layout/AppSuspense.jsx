import { Suspense, useCallback, useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import { MoxtLoadingScreen } from './MoxtLoadingScreen'
import {
  nextLoadingRetryKind,
  resetSoftLoadingRetryCount,
  retryAuthAndDataLoad,
} from './loadingRetry'

function LoadingSuccessReset() {
  useEffect(() => {
    resetSoftLoadingRetryCount()
  }, [])
  return null
}

/**
 * Suspense wrapper that soft-remounts (and retries auth/data) if the splash
 * stays visible longer than 5s. Caps soft retries, then one hard reload.
 */
export function AppSuspense({ children }) {
  const store = useStore()
  const [remountKey, setRemountKey] = useState(0)

  const handleStuck = useCallback(() => {
    const kind = nextLoadingRetryKind()
    if (kind === 'none') return
    if (kind === 'hard') {
      window.location.reload()
      return
    }
    void retryAuthAndDataLoad(store)
    setRemountKey((key) => key + 1)
  }, [store])

  return (
    <Suspense
      key={remountKey}
      fallback={<MoxtLoadingScreen autoRetry onStuck={handleStuck} />}
    >
      <LoadingSuccessReset />
      {children}
    </Suspense>
  )
}
