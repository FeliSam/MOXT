import { isAdminRole } from '../features/auth/roleUtils'

/** off | admin | all — traduction auto messages P2P (défaut : tous). */
export function canAutoTranslateMessages(user) {
  if (!user) return false
  const mode = String(import.meta.env.VITE_MESSAGE_AUTO_TRANSLATE || 'all').toLowerCase()
  if (mode === 'off') return false
  if (mode === 'all') return true
  if (mode === 'admin') return isAdminRole(user)
  return false
}

/** Menu traduction manuelle — tous les utilisateurs ; langues limitées sauf admin. */
export function canShowManualTranslate(user) {
  return Boolean(user)
}

/** Icône traduction admin : accès à toutes les langues MOXT. */
export function canShowAdminTranslateIcon(user) {
  return isAdminRole(user)
}
