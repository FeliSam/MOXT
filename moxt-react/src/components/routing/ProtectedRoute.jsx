import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export function ProtectedRoute({ allowedRoles }) {
  const user = useSelector((state) => state.auth.user)
  const status = useSelector((state) => state.auth.status)
  const location = useLocation()

  // Attendre que la restauration de session soit terminée avant de rediriger
  if (status === 'loading') return null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
