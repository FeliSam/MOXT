import { translate } from '@moxt/shared/i18n/translate.js'
import { addToast } from '../features/ui/uiSlice'
import { scheduleAppReload, startAppUpdateWatcher } from './appUpdate'

// Ne jamais interrompre une session active en cours d'usage : le rechargement
// se déclenche en priorité au prochain passage en arrière-plan (visibilitychange,
// géré par scheduleAppReload) ; ce délai n'est qu'un filet de sécurité pour les
// onglets qui restent au premier plan sans jamais être mis en arrière-plan.
const FALLBACK_RELOAD_DELAY_MS = 30 * 60 * 1000

function currentLanguage() {
  try {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('moxt-language')) || 'fr'
  } catch {
    return 'fr'
  }
}

/** Surveille version.json et prévient l'utilisateur avant rechargement. */
export function startReleaseWatcher(store) {
  return startAppUpdateWatcher({
    onUpdate: () => {
      const lang = currentLanguage()
      store.dispatch(
        addToast({
          title: translate(lang, 'common.update.title'),
          message: translate(lang, 'common.update.body'),
          tone: 'info',
        }),
      )
      scheduleAppReload({ reason: 'release', delayMs: FALLBACK_RELOAD_DELAY_MS })
    },
  })
}
