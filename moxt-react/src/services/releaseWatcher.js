import { translate } from '@moxt/shared/i18n/translate.js'
import { addToast } from '../features/ui/uiSlice'
import {
  hardReload,
  markUpdateStuckNotified,
  scheduleAppReload,
  startAppUpdateWatcher,
  wasUpdateStuckNotified,
} from './appUpdate'

/** Rechargement forcé rapide après détection d’une nouvelle version (toast puis reload). */
const FORCE_RELOAD_DELAY_MS = 2500

function currentLanguage() {
  try {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('moxt-language')) || 'fr'
  } catch {
    return 'fr'
  }
}

/** Surveille version.json et force le rechargement navigateur dès une nouvelle build. */
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
      scheduleAppReload({
        reason: 'release',
        delayMs: FORCE_RELOAD_DELAY_MS,
        reload: hardReload,
      })
    },
    onBlocked: () => {
      if (wasUpdateStuckNotified()) return
      markUpdateStuckNotified()
      const lang = currentLanguage()
      store.dispatch(
        addToast({
          title: translate(lang, 'common.update.stuckTitle'),
          message: translate(lang, 'common.update.stuckBody'),
          tone: 'warning',
        }),
      )
    },
  })
}
