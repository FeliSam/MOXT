import { needsRegisterProfileCompletion } from '@moxt/shared/auth/profileCompletion.js'
import { useSelector } from 'react-redux'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'

export function PublicOnlyRoute() {
  const user = useSelector((state) => state.auth.user)
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

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
