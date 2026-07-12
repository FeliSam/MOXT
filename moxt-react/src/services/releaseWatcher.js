import { addToast } from '../features/ui/uiSlice'
import { scheduleAppReload, startAppUpdateWatcher } from './appUpdate'

/** Surveille version.json et prévient l'utilisateur avant rechargement. */
export function startReleaseWatcher(store) {
  return startAppUpdateWatcher({
    onUpdate: () => {
      store.dispatch(
        addToast({
          title: 'Mise à jour MOXT',
          message: 'Nouvelle version détectée. Rechargement automatique…',
          tone: 'info',
        }),
      )
      scheduleAppReload({ reason: 'release', delayMs: 2000 })
    },
  })
}
