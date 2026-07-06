let deferredPrompt: any = null;
let installCallback: (() => void) | null = null;

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showUpdateAvailable();
                }
              });
            }
          });
        })
        .catch((err) => console.error('[PWA] SW registration failed:', err));
    });
  }
}

export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installCallback?.();
  });
}

export function canInstall(): boolean {
  return !!deferredPrompt;
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return result.outcome === 'accepted';
}

export function onInstallAvailable(cb: () => void) {
  installCallback = cb;
  if (deferredPrompt) cb();
}

function showUpdateAvailable() {
  if (confirm('Une nouvelle version de MOXT est disponible. Mettre à jour ?')) {
    window.location.reload();
  }
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}
