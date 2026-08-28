import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { canAccessDevModule, selectDevModuleFlags } from '../features/platform/devModuleAccess'

export function useDevModuleAccess(moduleId) {
  const user = useSelector((state) => state.auth.user)
  const flags = useSelector(selectDevModuleFlags)
  return canAccessDevModule(user, flags, moduleId)
}

export function useDevModuleFlags() {
  return useSelector(selectDevModuleFlags)
}

export function useDevModuleNavAccess() {
  const user = useSelector((state) => state.auth.user)
  const flags = useSelector(selectDevModuleFlags)
  return useCallback((moduleId) => canAccessDevModule(user, flags, moduleId), [user, flags])
}
