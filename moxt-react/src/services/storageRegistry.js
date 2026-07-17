export const STORAGE_SCHEMA_VERSION = 2
export const STORAGE_MANIFEST_KEY = 'moxt-storage-manifest-v2'
export const LEGACY_MIGRATION_KEY = 'moxt-legacy-migration-v1'
const RAW_STORAGE_KEYS = new Set(['moxt-theme'])

export const STORAGE_DOMAINS = [
  {
    id: 'account',
    labelKey: 'localData.domains.account',
    keys: ['moxt-account-v1'],
  },
  {
    id: 'businesses',
    labelKey: 'localData.domains.businesses',
    keys: [
      'moxt-businesses-v1',
      'moxt-business-members-v1',
      'moxt-business-documents-v1',
      'moxt-business-requests-v1',
    ],
  },
  {
    id: 'communications',
    labelKey: 'localData.domains.communications',
    keys: ['moxt-conversations-v1', 'moxt-support-v1', 'moxt-notifications-v1'],
  },
  {
    id: 'community',
    labelKey: 'localData.domains.community',
    keys: [
      'moxt-listings-v1',
      'moxt-listing-reports-v1',
      'moxt-marketplace-filters-v1',
      'moxt-listing-draft-v1',
      'moxt-jobs-v1',
      'moxt-job-applications-v1',
      'moxt-job-reports-v1',
      'moxt-events-v1',
      'moxt-event-registrations-v1',
      'moxt-event-reports-v1',
    ],
  },
  {
    id: 'services',
    labelKey: 'localData.domains.services',
    keys: [
      'moxt-transfers-v1',
      'moxt-parcels-v1',
      'moxt-parcel-requests-v1',
      'moxt-p2p-offers-v1',
      'moxt-p2p-orders-v1',
      'moxt-disputes-v1',
      'moxt-reviews-v1',
      'moxt-finance-v1',
    ],
  },
  {
    id: 'administration',
    labelKey: 'localData.domains.administration',
    keys: ['moxt-administration-v1', 'moxt-audit-v1'],
  },
  {
    id: 'interface',
    labelKey: 'localData.domains.interface',
    keys: ['moxt-theme', 'moxt-rub-xof-rate-v1', STORAGE_MANIFEST_KEY, LEGACY_MIGRATION_KEY],
  },
]

function inspectValue(storage, key) {
  const raw = storage.getItem(key)
  if (raw === null) return { key, status: 'empty', bytes: 0, count: 0 }
  const bytes = new Blob([raw]).size
  if (RAW_STORAGE_KEYS.has(key)) return { key, status: 'valid', bytes, count: 1 }
  try {
    const value = JSON.parse(raw)
    const count = Array.isArray(value)
      ? value.length
      : value && typeof value === 'object'
        ? Object.keys(value).length
        : 1
    return { key, status: 'valid', bytes, count }
  } catch {
    return { key, status: 'invalid', bytes, count: 0 }
  }
}

export function storageAvailable(storage = globalThis.localStorage) {
  if (!storage) return false
  const key = '__moxt_storage_test__'
  try {
    storage.setItem(key, '1')
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function inspectLocalData(storage = globalThis.localStorage) {
  if (!storageAvailable(storage)) {
    return { available: false, totalBytes: 0, invalidKeys: [], domains: [] }
  }
  const domains = STORAGE_DOMAINS.map((domain) => {
    const entries = domain.keys.map((key) => inspectValue(storage, key))
    return {
      ...domain,
      entries,
      bytes: entries.reduce((total, entry) => total + entry.bytes, 0),
      count: entries.reduce((total, entry) => total + entry.count, 0),
      invalid: entries.filter((entry) => entry.status === 'invalid').length,
    }
  })
  return {
    available: true,
    totalBytes: domains.reduce((total, domain) => total + domain.bytes, 0),
    invalidKeys: domains.flatMap((domain) =>
      domain.entries.filter((entry) => entry.status === 'invalid').map((entry) => entry.key),
    ),
    domains,
  }
}

export function exportLocalData(storage = globalThis.localStorage) {
  const data = {}
  STORAGE_DOMAINS.flatMap((domain) => domain.keys).forEach((key) => {
    const value = storage?.getItem(key)
    if (value !== null && value !== undefined) data[key] = value
  })
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function resetLocalDataDomains(domainIds, storage = globalThis.localStorage) {
  const selected = new Set(domainIds)
  STORAGE_DOMAINS.filter((domain) => selected.has(domain.id)).forEach((domain) => {
    domain.keys.forEach((key) => storage?.removeItem(key))
  })
}

export function writeStorageManifest(values = {}, storage = globalThis.localStorage) {
  const manifest = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    ...values,
  }
  storage?.setItem(STORAGE_MANIFEST_KEY, JSON.stringify(manifest))
  return manifest
}

export function readStorageManifest(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage?.getItem(STORAGE_MANIFEST_KEY) || 'null')
  } catch {
    return null
  }
}
