import { Capacitor } from '@capacitor/core'
import { resetKeyboardAfterBackground } from '../hooks/useKeyboardInset'
import { navigateDeepLink } from './deepLinks'
import { pauseAllDocumentMedia } from './mediaPlayback'

export const isNative = Capacitor.isNativePlatform()
export const nativePlatform = Capacitor.getPlatform()

/** Dispatched on the window after a Capacitor foreground so UI can unstick overlays. */
export const NATIVE_RESUME_EVENT = 'moxt:native-resume'
export const NATIVE_PAUSE_EVENT = 'moxt:native-pause'

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
  try {
    if (typeof document !== 'undefined' && !document.querySelector('.moxt-loading-screen')) {
      document.documentElement.classList.remove('moxt-splash-lock')
    }
  } catch {
    /* early boot / no document */
  }
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
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140
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

function dispatchCustomEvent(name) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name))
}

function forceWebViewHitTestRebuild(root) {
  root.classList.add('capacitor-thawing')
  void root.offsetHeight
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      root.classList.remove('capacitor-thawing')
    })
    return
  }
  window.setTimeout(() => root.classList.remove('capacitor-thawing'), 0)
}

/**
 * iOS WKWebView often freezes compositing / keyboard chrome after sleep.
 * Clear stuck overlays and force a layout pass so taps hit the visible buttons.
 */
export function recoverNativeUiAfterResume(root = document.documentElement) {
  root.classList.remove('capacitor-paused')
  if (typeof document !== 'undefined' && !document.querySelector('.moxt-loading-screen')) {
    root.classList.remove('moxt-splash-lock')
  }

  resetKeyboardAfterBackground(root)
  forceWebViewHitTestRebuild(root)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('resize'))
    window.visualViewport?.dispatchEvent?.(new Event('resize'))
  }
  dispatchCustomEvent(NATIVE_RESUME_EVENT)
}

export function markNativePaused(root = document.documentElement) {
  root.classList.add('capacitor-paused')
  resetKeyboardAfterBackground(root)
  pauseAllDocumentMedia()
  dispatchCustomEvent(NATIVE_PAUSE_EVENT)
}

async function hideNativeKeyboard() {
  if (!isNative) return
  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    await Keyboard.hide()
  } catch {
    /* plugin indisponible */
  }
}

function handleNativePause() {
  markNativePaused()
}

function handleNativeResume() {
  recoverNativeUiAfterResume()
  void hideNativeSplash()
  void hideNativeKeyboard()
  void applyNativeStatusBar()
  void import('./pushNotifications')
    .then(({ initNativePushNotifications }) => initNativePushNotifications())
    .catch(() => {})
}

/** Initialise le shell natif (splash, status bar, clavier, bouton retour). */
export async function initCapacitor() {
  if (!isNative) return

  markNativeShell()
  void hideNativeSplash()

  const [{ App }, { Keyboard, KeyboardResize }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/keyboard'),
  ])

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      handleNativeResume()
      return
    }
    handleNativePause()
  })

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
