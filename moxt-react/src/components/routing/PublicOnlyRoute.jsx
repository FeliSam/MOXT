import { needsRegisterProfileCompletion } from '@moxt/shared/auth/profileCompletion.js'
import { useSelector } from 'react-redux'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { AuthLoadingScreen } from '../layout/AuthLoadingScreen'

export function PublicOnlyRoute() {
  const user = useSelector((state) => state.auth.user)
  const status = useSelector((state) => state.auth.status)
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  // Avoid bouncing to /register while login/OTP is still resolving the real profile.
  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (user) {
    // Incomplete signup/OAuth must not bounce login → dashboard → register forever.
    // Send them to finish profile; RegisterPage "Se connecter" logs out first.
    if (needsRegisterProfileCompletion(user)) {
      return <Navigate to="/register" replace />
    }
    if (returnTo && returnTo.startsWith('/')) {
      return <Navigate to={decodeURIComponent(returnTo)} replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
