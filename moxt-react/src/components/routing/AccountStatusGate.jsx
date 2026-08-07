import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

/** Comptes suspendus : accès limité à la page statut et au support. */
const ALLOWED_WHEN_SUSPENDED = ['/account/status', '/support']

export function AccountStatusGate() {
  const user = useSelector((state) => state.auth.user)
  const location = useLocation()

  if (
    user?.status === 'suspended' &&
    !ALLOWED_WHEN_SUSPENDED.includes(location.pathname)
  ) {
    return <Navigate to="/account/status" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
