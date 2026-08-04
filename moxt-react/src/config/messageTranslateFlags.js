import { isAdminRole } from '../features/auth/roleUtils'

/** off | admin | all — traduction auto messages P2P */
export function canAutoTranslateMessages(user) {
  const mode = String(import.meta.env.VITE_MESSAGE_AUTO_TRANSLATE || 'admin').toLowerCase()
  if (mode === 'all') return true
  if (mode === 'admin') return isAdminRole(user)
  return false
}

/** Icône traduction manuelle dans le menu message — réservée aux admins. */
export function canShowAdminTranslateIcon(user) {
  return isAdminRole(user)
}
