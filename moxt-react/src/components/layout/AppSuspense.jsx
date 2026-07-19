import { Suspense, useEffect } from 'react'
import { AppLoadingFallback } from './AppLoadingFallback'
import { resetSoftLoadingRetryCount } from './loadingRetry'

function LoadingSuccessReset() {
  useEffect(() => {
    resetSoftLoadingRetryCount()
  }, [])
  return null
}

/**
 * Suspense wrapper for lazy routes — spinner only (no brand splash art).
 */
export function AppSuspense({ children }) {
  return (
    <Suspense fallback={<AppLoadingFallback />}>
      <LoadingSuccessReset />
      {children}
    </Suspense>
  )
}
