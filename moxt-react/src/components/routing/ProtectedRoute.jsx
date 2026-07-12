import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isProfileComplete } from '@moxt/shared/auth/profileCompletion.js'

export function ProtectedRoute({ allowedRoles }) {
  const user = useSelector((state) => state.auth.user)
  const status = useSelector((state) => state.auth.status)
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--app-bg)] text-sm font-bold text-[var(--app-text-muted)]">
        Chargement de MOXT...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isProfileComplete(user) && location.pathname !== '/register') {
    return <Navigate to="/register" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
