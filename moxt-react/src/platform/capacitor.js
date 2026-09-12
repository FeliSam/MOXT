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

const STATUS_BAR_BG = {
  light: '#f7f8fa',
  dark: '#0c0c0e',
}

/** Fond sombre de l’app (pas le mode nuit du téléphone). */
function isDarkAppBackground() {
  if (typeof document === 'undefined') return false
  const root = document.documentElement
  if (root.classList.contains('feed-mobile-immersive')) return true
  if (root.classList.contains('dark')) return true
  const raw = getComputedStyle(root).backgroundColor || ''
  const m = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (!m) return false
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 140
}

/**
 * Capacitor 8 SystemBars / StatusBar :
 * LIGHT = texte et icônes noirs (fond clair)
 * DARK  = texte et icônes blancs (fond sombre)
 */
async function applyNativeStatusBar() {
  if (!isNative) return
  const darkBg = isDarkAppBackground()
  const bg = darkBg ? STATUS_BAR_BG.dark : STATUS_BAR_BG.light

  try {
    const core = await import('@capacitor/core')
    if (core.SystemBars?.setStyle && core.SystemBarsStyle) {
      await core.SystemBars.setStyle({
        style: darkBg ? core.SystemBarsStyle.Dark : core.SystemBarsStyle.Light,
      })
    }
  } catch {
    /* SystemBars absent sur un core trop ancien */
  }

  const { StatusBar, Style } = await import('@capacitor/status-bar')
  if (nativePlatform === 'ios') {
    await StatusBar.setOverlaysWebView({ overlay: true })
  }
  await StatusBar.setStyle({ style: darkBg ? Style.Dark : Style.Light })
  if (nativePlatform === 'android') {
    try {
      await StatusBar.setBackgroundColor({ color: bg })
    } catch {
      /* Android 15+ ignore souvent la couleur de fond (edge-to-edge). */
    }
  }
}

/** Initialise le shell natif (splash, status bar, clavier, bouton retour). */
export async function initCapacitor() {
  if (!isNative) return

  markNativeShell()

  const [{ App }, { Keyboard, KeyboardResize }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/keyboard'),
  ])

  try {
    if (nativePlatform === 'ios') {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native })
      await Keyboard.setAccessoryBarVisible({ isVisible: false })
    } else {
      await Keyboard.setResizeMode({ mode: KeyboardResize.None })
    }
  } catch {
    /* plugin indisponible sur certaines plateformes */
  }

  try {
    await applyNativeStatusBar()
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
      void applyNativeStatusBar()
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

/** Met à jour la barre de statut quand le thème ou le fond immersif change. */
export async function syncCapacitorStatusBar() {
  if (!isNative) return
  try {
    await applyNativeStatusBar()
  } catch {
    /* ignore */
  }
}
