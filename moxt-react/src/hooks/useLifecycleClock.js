import { useSyncExternalStore } from 'react'

const TICK_MS = 30_000

/** Valeur stable lue par getSnapshot — mise à jour uniquement au tick. */
let cachedNow = 0

function subscribe(onStoreChange) {
  cachedNow = Date.now()
  const timer = window.setInterval(() => {
    cachedNow = Date.now()
    onStoreChange()
  }, TICK_MS)
  return () => window.clearInterval(timer)
}

function getSnapshot() {
  return cachedNow
}

function getServerSnapshot() {
  return 0
}

/** Horloge partagée pour comptes à rebours (suspendu, suppression). */
export function useLifecycleClock() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
