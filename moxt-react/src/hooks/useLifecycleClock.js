import { useSyncExternalStore } from 'react'

const TICK_MS = 30_000

function subscribe(onStoreChange) {
  const timer = window.setInterval(onStoreChange, TICK_MS)
  return () => window.clearInterval(timer)
}

function getSnapshot() {
  return Date.now()
}

function getServerSnapshot() {
  return 0
}

/** Horloge partagée pour comptes à rebours (suspendu, suppression). */
export function useLifecycleClock() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
