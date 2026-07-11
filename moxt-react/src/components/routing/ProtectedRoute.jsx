import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isProfileComplete } from '@moxt/shared/auth/profileCompletion.js'

export function ProtectedRoute({ allowedRoles }) {
  const user = useSelector((state) => state.auth.user)
  const status = useSelector((state) => state.auth.status)
  const location = useLocation()

  if (status === 'loading') return null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isProfileComplete(user) && location.pathname !== '/register') {
    return <Navigate to="/register?from=google" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
