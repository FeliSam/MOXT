import { Capacitor } from '@capacitor/core'
import { navigateDeepLink } from './deepLinks'

export const isNative = Capacitor.isNativePlatform()
export const nativePlatform = Capacitor.getPlatform()

/** Appliquer dès le chargement du module — avant le 1er paint React. */
function markNativeShell() {
  if (!isNative || typeof document === 'undefined') return
  document.documentElement.classList.add('capacitor-native', `capacitor-${nativePlatform}`)
}

markNativeShell()

async function bindDeepLinks(App) {
  App.addListener('appUrlOpen', ({ url }) => {
    navigateDeepLink(url)
  })

  try {
    const launch = await App.getLaunchUrl()
    if (launch?.url) {
      setTimeout(() => navigateDeepLink(launch.url), 0)
    }
  } catch {
    /* getLaunchUrl indisponible sur certaines versions */
  }
}

/** Masque le splash natif dès que le WebView peut afficher l’UI web. */
export async function hideNativeSplash() {
  if (!isNative) return
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    /* plugin indisponible */
  }
}

/** Initialise le shell natif (splash, status bar, clavier, bouton retour). */
export async function initCapacitor() {
  if (!isNative) return

  markNativeShell()

  const [{ App }, { StatusBar, Style }, { Keyboard, KeyboardResize }] =
    await Promise.all([
      import('@capacitor/app'),
      import('@capacitor/status-bar'),
      import('@capacitor/keyboard'),
    ])

  try {
    // None: layout viewport stays full so fixed bottom chrome is not lifted.
    // Composer/chat use --keyboard-inset from visualViewport instead.
    await Keyboard.setResizeMode({ mode: KeyboardResize.None })
  } catch {
    /* plugin indisponible sur certaines plateformes */
  }

  try {
    const isDark = document.documentElement.classList.contains('dark')
    await StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark })
    if (nativePlatform === 'android') {
      await StatusBar.setBackgroundColor({ color: isDark ? '#0c0c0e' : '#ffffff' })
    }
  } catch {
    /* status bar optionnelle */
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
      return
    }
    App.exitApp()
  })

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      document.documentElement.classList.remove('capacitor-paused')
    } else {
      document.documentElement.classList.add('capacitor-paused')
    }
  })

  await bindDeepLinks(App)

  await hideNativeSplash()

  void import('../services/media/mobileMediaCache.js')
    .then(({ initMobileMediaCache }) => initMobileMediaCache())
    .catch(() => {})

  void import('./pushNotifications')
    .then(({ initNativePushNotifications }) => initNativePushNotifications())
    .catch(() => {
      /* push optionnel sans google-services.json */
    })
}

/** Met à jour la barre de statut quand le thème change (dark/light). */
export async function syncCapacitorStatusBar(isDark) {
  if (!isNative) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
    if (nativePlatform === 'android') {
      await StatusBar.setBackgroundColor({ color: isDark ? '#0c0c0e' : '#08705f' })
    }
  } catch {
    /* ignore */
  }
}
