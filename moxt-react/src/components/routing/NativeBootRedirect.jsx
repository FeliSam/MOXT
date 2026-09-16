import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthLoadingScreen } from '../layout/AuthLoadingScreen'
import { isNative } from '../../platform/capacitor'
import { shouldHoldNativeHomeForAuth, shouldRedirectNativeHome } from './nativeHomeRedirect'

export function NativeBootRedirect() {
  const userId = useSelector((state) => state.auth.user?.id)
  const status = useSelector((state) => state.auth.status)
  const { pathname } = useLocation()

  if (shouldHoldNativeHomeForAuth({ native: isNative, pathname, status })) {
    return <AuthLoadingScreen />
  }
  if (!shouldRedirectNativeHome({ native: isNative, pathname, userId, status })) return null
  return <Navigate to="/dashboard" replace />
}
