import { DEFAULT_DEV_MODULE_FLAGS, normalizeDevModuleFlags } from '../../config/devModules'
import { isAdminRole } from '../auth/roleUtils'

export function canAccessDevModule(user, flags, moduleId) {
  if (!moduleId) return true
  if (isAdminRole(user)) return true
  const normalized = normalizeDevModuleFlags(flags || DEFAULT_DEV_MODULE_FLAGS)
  return Boolean(normalized[moduleId])
}

export function selectDevModuleFlags(state) {
  return normalizeDevModuleFlags(state.platformModules?.flags || DEFAULT_DEV_MODULE_FLAGS)
}

export function canAccessDevModuleFromState(state, moduleId) {
  return canAccessDevModule(state.auth?.user, selectDevModuleFlags(state), moduleId)
}
