import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

export function PublicOnlyRoute() {
  const user = useSelector((state) => state.auth.user)
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}
