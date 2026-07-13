import { useSelector } from 'react-redux'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'

export function PublicOnlyRoute() {
  const user = useSelector((state) => state.auth.user)
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  if (user) {
    if (returnTo && returnTo.startsWith('/')) {
      return <Navigate to={decodeURIComponent(returnTo)} replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
