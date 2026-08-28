import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { canAccessDevModule, selectDevModuleFlags } from '../../features/platform/devModuleAccess'

export function DevModuleRoute({ moduleId, children, fallback = '/dashboard' }) {
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const flags = useSelector(selectDevModuleFlags)
  if (canAccessDevModule(user, flags, moduleId)) return children
  return <Navigate to={fallback} replace state={{ from: location.pathname }} />
}
