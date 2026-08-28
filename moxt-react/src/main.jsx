import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ensureClientCacheVersion } from './services/clearClientCache'
import { isE2eHarnessActive } from './services/e2eSession'
import './index.css'

function scheduleDeferredMaintenance() {
  const run = () => {
    void import('./services/legacyMigration').then(({ migrateLegacyStorage, cleanupLocalStorage }) => {
      migrateLegacyStorage()
      cleanupLocalStorage()
    })
    void import('./services/seedDemoContent').then(({ clearDemoContent }) => clearDemoContent())
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 4000 })
  } else {
    setTimeout(run, 50)
  }
}

async function bootstrap() {
  ensureClientCacheVersion()
  scheduleDeferredMaintenance()

  const [{ AppProviders }, { AppRouter }, { AppErrorBoundary }, { ToastViewport }, { store }, { ensureLocaleLoaded }, { resolveInitialLanguage }] =
    await Promise.all([
      import('./app/providers'),
      import('./app/router'),
      import('./components/feedback/AppErrorBoundary'),
      import('./components/ui/Toast'),
      import('./app/store'),
      import('./i18n/translate'),
      import('./config/uiTranslations'),
    ])

  const initialLanguage = resolveInitialLanguage(localStorage.getItem('moxt-language'))
  if (initialLanguage !== 'fr') {
    await ensureLocaleLoaded(initialLanguage)
  }

  const { hydrateAuthFromBootstrapCache } = await import('./services/authBootstrapCache')
  hydrateAuthFromBootstrapCache(store.dispatch)

  const { loadPlatformModules } = await import('./features/platform/platformModulesSlice')
  void store.dispatch(loadPlatformModules())

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AppProviders>
        <AppErrorBoundary>
          <AppRouter />
          <ToastViewport />
        </AppErrorBoundary>
      </AppProviders>
    </StrictMode>,
  )

  void import('./platform/capacitor').then(({ hideNativeSplash, initCapacitor }) => {
    hideNativeSplash()
    void initCapacitor()
  })

  const { startAuthSessionSync } = await import('./services/authSessionSync')
  startAuthSessionSync(store)

  void import('./features/auth/authSlice').then(({ restoreSession }) => {
    void store.dispatch(restoreSession()).then(async () => {
      const user = store.getState().auth.user
      if (!user) {
        const { clearAppBadge } = await import('./platform/appBadge')
        clearAppBadge()
        return
      }
      if (isE2eHarnessActive()) return

      const { scheduleCatalogSync } = await import('./app/catalogSync')
      void scheduleCatalogSync(store)

      const scheduleRealtime = () => {
        void import('./services/realtimeService').then(({ startRealtimeSubscription }) => {
          void startRealtimeSubscription(user.id, store.dispatch, store.getState)
        })
      }
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(scheduleRealtime, { timeout: 4000 })
      } else {
        setTimeout(scheduleRealtime, 600)
      }
    })
  })

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(
      () => {
        void import('./pages/DashboardPage')
        void import('./config/navigation').then(({ preloadRoute, warmNavRoutes }) => {
          preloadRoute('/dashboard')
          warmNavRoutes(['/transfers', '/marketplace', '/parcels'])
        })
      },
      { timeout: 5000 },
    )
  }
}

bootstrap()

if (import.meta.env.PROD) {
  void import('./platform/capacitor').then(({ isNative }) => {
    if (isNative) return
    void import('./pwa').then(({ registerServiceWorker, listenForInstallPrompt, listenForServiceWorkerMessages }) => {
      registerServiceWorker()
      listenForInstallPrompt()
      listenForServiceWorkerMessages()
    })
    void import('./services/releaseWatcher').then(({ startReleaseWatcher }) => {
      void import('./app/store').then(({ store }) => {
        startReleaseWatcher(store)
      })
    })
  })
}
