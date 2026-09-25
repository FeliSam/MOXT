import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ensureClientCacheVersion } from './services/clearClientCache'
import { isE2eHarnessActive } from './services/e2eSession'
import './index.css'

function scheduleDeferredMaintenance() {
  const run = () => {
    void import('./services/legacyMigration').then(
      ({ migrateLegacyStorage, cleanupLocalStorage }) => {
        migrateLegacyStorage()
        cleanupLocalStorage()
      },
    )
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

  // Capacitor: hide splash as soon as JS runs — do not wait for plugins / locale / routes / catalog.
  try {
    document.documentElement.classList.remove('moxt-splash-lock')
  } catch {
    /* SSR / early boot */
  }
  void import('./platform/capacitor').then(({ hideNativeSplash }) => {
    void hideNativeSplash()
  })
  // Warm the first screens while the shell modules parse (local WKWebView chunk parse is the wait).
  void import('./pages/DashboardPage')
  void import('./pages/LoginPage')
  void import('./pages/PublicHomePage')

  const [
    { AppProviders },
    { AppRouter },
    { AppErrorBoundary },
    { ToastViewport },
    { store },
    { ensureLocaleLoaded },
    { resolveInitialLanguage },
  ] = await Promise.all([
    import('./app/providers'),
    import('./app/router'),
    import('./components/feedback/AppErrorBoundary'),
    import('./components/ui/Toast'),
    import('./app/store'),
    import('./i18n/translate'),
    import('./config/uiTranslations'),
  ])

  const { detectDistributionStore, localeForStore } = await import('./config/storeLocales')
  const storeDefault = localeForStore(detectDistributionStore())
  const initialLanguage = resolveInitialLanguage(
    localStorage.getItem('moxt-language'),
    storeDefault,
  )
  if (initialLanguage !== 'fr') {
    // LanguageProvider re-renders when the dictionary arrives — do not block first paint.
    void ensureLocaleLoaded(initialLanguage)
  }

  const { hydrateAuthFromBootstrapCache } = await import('./services/authBootstrapCache')
  hydrateAuthFromBootstrapCache(store.dispatch)

  // IndexedDB hydrate before first paint (short timeout so slow IDB never blocks).
  const IDB_HYDRATE_MS = 150
  const withTimeout = (promise, ms) =>
    Promise.race([
      promise,
      new Promise((resolve) => {
        setTimeout(() => resolve(undefined), ms)
      }),
    ])

  await withTimeout(
    (async () => {
      const [{ readListingsFromIdb }, { readVideosFromIdb, readPostsFromIdb }] = await Promise.all([
        import('./features/marketplace/marketplaceListingsIdb.js'),
        import('./features/feed/feedCatalogIdb.js'),
      ])
      const [listings, videos, posts] = await Promise.all([
        readListingsFromIdb(),
        readVideosFromIdb(),
        readPostsFromIdb(),
      ])
      if (listings.length) {
        const current = store.getState().marketplace?.items || []
        if (listings.length > current.length) {
          const { setAll } = await import('./features/marketplace/marketplaceSlice')
          store.dispatch(setAll({ items: listings }))
        }
      }
      if (videos.length) {
        const current = store.getState().videos?.items || []
        if (videos.length > current.length) {
          const { setAll } = await import('./features/videos/videosSlice')
          store.dispatch(setAll({ items: videos }))
        }
      }
      if (posts.length) {
        const current = store.getState().posts?.items || []
        if (posts.length > current.length) {
          const { setAll } = await import('./features/posts/postsSlice')
          store.dispatch(setAll({ items: posts }))
        }
      }
    })(),
    IDB_HYDRATE_MS,
  )

  const { primeStatusRail } = await import('./features/statuses/statusSync')
  void primeStatusRail(store)

  const { loadPlatformModules } = await import('./features/platform/platformModulesSlice')
  const { loadStoreLocales } = await import('./features/platform/storeLocalesSlice')
  const { loadFeedPlayback } = await import('./features/platform/feedPlaybackSlice')
  const { loadAvatarSettings } = await import('./features/platform/avatarSettingsSlice')
  void store.dispatch(loadPlatformModules())
  void store.dispatch(loadStoreLocales())
  void store.dispatch(loadFeedPlayback())
  void store.dispatch(loadAvatarSettings())

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

      const { primeStatusRail } = await import('./features/statuses/statusSync')
      void primeStatusRail(store)
      const { scheduleCatalogSync } = await import('./app/catalogSync')
      void scheduleCatalogSync(store)

      void import('./services/realtimeService').then(({ startRealtimeSubscription }) => {
        void startRealtimeSubscription(user.id, store.dispatch, store.getState)
      })
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
    void import('./pwa').then(
      ({ registerServiceWorker, listenForInstallPrompt, listenForServiceWorkerMessages }) => {
        registerServiceWorker()
        listenForInstallPrompt()
        listenForServiceWorkerMessages()
      },
    )
    void import('./services/releaseWatcher').then(({ startReleaseWatcher }) => {
      void import('./app/store').then(({ store }) => {
        startReleaseWatcher(store)
      })
    })
  })
}
