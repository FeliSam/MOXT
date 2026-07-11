let deferredPrompt: BeforeInstallPromptEvent | null = null
let installCallback: (() => void) | null = null
let refreshing = false

const SW_UPDATE_MS = 5 * 60 * 1000

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function activateWaitingWorker(registration: ServiceWorkerRegistration) {
  const waiting = registration.waiting
  if (!waiting) return
  waiting.postMessage({ type: 'SKIP_WAITING' })
}

function listenForControllerChange() {
  if (refreshing) return
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  listenForControllerChange()

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope)

        if (registration.waiting) {
          activateWaitingWorker(registration)
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return

          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              activateWaitingWorker(registration)
            }
          })
        })

        const checkSwUpdate = () => {
          void registration.update().catch(() => {})
        }

        checkSwUpdate()
        window.setInterval(checkSwUpdate, SW_UPDATE_MS)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkSwUpdate()
        })
      })
      .catch((err) => console.error('[PWA] SW registration failed:', err))
  })
}

export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    installCallback?.()
  })
}

export function canInstall(): boolean {
  return !!deferredPrompt
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  await deferredPrompt.prompt()
  const result = await deferredPrompt.userChoice
  deferredPrompt = null
  return result.outcome === 'accepted'
}

export function onInstallAvailable(cb: () => void) {
  installCallback = cb
  if (deferredPrompt) cb()
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
