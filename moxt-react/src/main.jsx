import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { cleanupLocalStorage, migrateLegacyStorage } from './services/legacyMigration'
import { clearDemoContent } from './services/seedDemoContent'
import { ensureClientCacheVersion } from './services/clearClientCache'
import './index.css'

async function bootstrap() {
  ensureClientCacheVersion()
  migrateLegacyStorage()
  cleanupLocalStorage()
  clearDemoContent()

  const [{ initCapacitor, isNative }, { AppProviders }, { AppRouter }, { AppErrorBoundary }, { ToastViewport }, { store }] =
    await Promise.all([
    import('./platform/capacitor'),
    import('./app/providers'),
    import('./app/router'),
    import('./components/feedback/AppErrorBoundary'),
    import('./components/ui/Toast'),
    import('./app/store'),
  ])

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

  const { startAuthSessionSync } = await import('./services/authSessionSync')
  startAuthSessionSync(store)

  const { restoreSession } = await import('./features/auth/authSlice')
  void store.dispatch(restoreSession()).then(async () => {
    const user = store.getState().auth.user
    if (!user) {
      const { clearAppBadge } = await import('./platform/appBadge')
      clearAppBadge()
      return
    }

    const { loadAllData } = await import('./app/loadAllData')
    store.dispatch(loadAllData())

    const scheduleRealtime = async () => {
      const { startRealtimeSubscription } = await import('./services/realtimeService')
      void startRealtimeSubscription(user.id, store.dispatch, store.getState)
    }
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => void scheduleRealtime(), { timeout: 2500 })
    } else {
      setTimeout(() => void scheduleRealtime(), 400)
    }
  })

  await initCapacitor()
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
