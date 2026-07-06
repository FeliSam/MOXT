// Les IDs démo ont tous le suffixe -DEMO- pour être identifiables et supprimables.
const DEMO_ID_MARKER = '-DEMO-'

const DEMO_KEYS = [
  'moxt-businesses-v1',
  'moxt-parcels-v1',
  'moxt-parcel-requests-v1',
  'moxt-jobs-v1',
  'moxt-job-applications-v1',
  'moxt-events-v1',
  'moxt-event-registrations-v1',
  'moxt-listings-v1',
  'moxt-p2p-offers-v1',
  'moxt-p2p-orders-v1',
]

// Supprime tous les éléments dont l'id contient -DEMO- des collections locales.
export function clearDemoContent(storage = globalThis.localStorage) {
  if (!storage) return
  DEMO_KEYS.forEach((key) => {
    try {
      const parsed = JSON.parse(storage.getItem(key) || '[]')
      if (!Array.isArray(parsed)) return
      const cleaned = parsed.filter(
        (item) => typeof item?.id !== 'string' || !item.id.includes(DEMO_ID_MARKER),
      )
      if (cleaned.length !== parsed.length) {
        storage.setItem(key, JSON.stringify(cleaned))
      }
    } catch {
      // Clé corrompue — on ne touche pas
    }
  })
}

// Conservée pour compatibilité avec les tests existants mais ne fait plus rien.
export function seedDemoContent() {
  return 0
}
