import { isAdminRole } from '../features/auth/roleUtils'
import { addToast } from '../features/ui/uiSlice'

/** Toasts d’erreur système : visibles uniquement pour admin/superadmin. */
export function dispatchAdminOnlyErrorToast(store, payload) {
  const user = store.getState()?.auth?.user
  if (!isAdminRole(user)) {
    console.warn('[moxt:error]', payload?.title, payload?.message)
    return
  }
  store.dispatch(
    addToast({
      tone: 'error',
      ...payload,
    }),
  )
}
