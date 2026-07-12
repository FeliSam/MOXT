import { Capacitor } from '@capacitor/core'
import { navigateDeepLink } from './deepLinks'

export const isNative = Capacitor.isNativePlatform()
export const nativePlatform = Capacitor.getPlatform()

function markNativeShell() {
  document.documentElement.classList.add('capacitor-native', `capacitor-${nativePlatform}`)
}

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

/** Initialise le shell natif (splash, status bar, clavier, bouton retour). */
export async function initCapacitor() {
  if (!isNative) return

  markNativeShell()

  const [{ App }, { SplashScreen }, { StatusBar, Style }, { Keyboard, KeyboardResize }] =
    await Promise.all([
      import('@capacitor/app'),
      import('@capacitor/splash-screen'),
      import('@capacitor/status-bar'),
      import('@capacitor/keyboard'),
    ])

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body })
  } catch {
    /* plugin indisponible sur certaines plateformes */
  }

  try {
    const isDark = document.documentElement.classList.contains('dark')
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
    if (nativePlatform === 'android') {
      await StatusBar.setBackgroundColor({ color: isDark ? '#0c0c0e' : '#08705f' })
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

  try {
    const { initNativePushNotifications } = await import('./pushNotifications')
    await initNativePushNotifications()
  } catch {
    /* push optionnel sans google-services.json */
  }

  await SplashScreen.hide()
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
