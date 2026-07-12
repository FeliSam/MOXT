import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { cleanupLocalStorage, migrateLegacyStorage } from './services/legacyMigration'
import { clearDemoContent } from './services/seedDemoContent'
import './index.css'

async function bootstrap() {
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

  // Restaure la session Supabase avant le premier rendu pour éviter
  // un flash "non connecté" si l'utilisateur avait une session active.
  const { restoreSession } = await import('./features/auth/authSlice')
  await store.dispatch(restoreSession())

  const { startAuthSessionSync } = await import('./services/authSessionSync')
  startAuthSessionSync(store)

  // Si une session existe, charger toutes les données depuis Supabase
  if (store.getState().auth.user) {
    const { loadAllData } = await import('./app/loadAllData')
    store.dispatch(loadAllData())

    const { startRealtimeSubscription } = await import('./services/realtimeService')
    void startRealtimeSubscription(store.getState().auth.user.id, store.dispatch, store.getState)
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AppErrorBoundary>
        <AppProviders>
          <AppRouter />
          <ToastViewport />
        </AppProviders>
      </AppErrorBoundary>
    </StrictMode>,
  )

  await initCapacitor()
}

bootstrap()

if (import.meta.env.PROD) {
  import('./platform/capacitor').then(({ isNative }) => {
    if (isNative) return
    import('./pwa').then(({ registerServiceWorker, listenForInstallPrompt }) => {
      registerServiceWorker()
      listenForInstallPrompt()
    })
    import('./services/releaseWatcher').then(({ startReleaseWatcher }) => {
      import('./app/store').then(({ store }) => {
        startReleaseWatcher(store)
      })
    })
  })
}
