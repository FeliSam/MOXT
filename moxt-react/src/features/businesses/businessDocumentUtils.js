/** Aligné sur private.moxt_sanitize_storage_segment (Supabase). */
export function sanitizeStorageSegment(value) {
  const raw = String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_')
  return raw || ''
}

/** Extrait le segment entreprise depuis `{owner}/business/{biz}/…`. */
export function parseBusinessIdFromStoragePath(storagePath) {
  if (!storagePath || typeof storagePath !== 'string') return null
  const parts = storagePath.split('/').filter(Boolean)
  if (parts.length >= 4 && parts[1] === 'business' && parts[2]) {
    return parts[2]
  }
  return null
}

function findBusinessForSegment(segment, businesses = []) {
  if (!segment) return null
  const exact = businesses.find((entry) => entry.id === segment)
  if (exact) return exact
  const safe = sanitizeStorageSegment(segment)
  if (!safe) return null
  return (
    businesses.find((entry) => sanitizeStorageSegment(entry.id) === safe) ||
    null
  )
}

/** Résout l'entreprise propriétaire d'un document (chemin storage prioritaire). */
export function resolveDocumentBusinessId(document, businesses = []) {
  const pathSegment = parseBusinessIdFromStoragePath(
    document.storagePath || document.storage_path,
  )
  const fromPath = findBusinessForSegment(pathSegment, businesses)
  if (fromPath) return fromPath.id

  if (document.businessId) {
    const fromRow = findBusinessForSegment(document.businessId, businesses)
    if (fromRow) return fromRow.id
  }

  const ownerId = document.ownerId || document.owner_id
  if (ownerId) {
    const owned = businesses.filter((entry) => String(entry.ownerId) === String(ownerId))
    if (owned.length === 1) return owned[0].id
  }

  return document.businessId || pathSegment || null
}

export function enrichBusinessDocument(document, businesses = []) {
  const resolvedBusinessId = resolveDocumentBusinessId(document, businesses)
  if (!resolvedBusinessId || resolvedBusinessId === document.businessId) {
    return document
  }
  return {
    ...document,
    businessId: resolvedBusinessId,
    _businessIdReconciledFrom: 'storage_path',
  }
}

export function enrichBusinessDocuments(documents = [], businesses = []) {
  return documents.map((document) => enrichBusinessDocument(document, businesses))
}

export function groupBusinessDocumentsByOwner(documents = [], businesses = [], users = []) {
  const groups = new Map()

  for (const document of documents) {
    const business = businesses.find((entry) => entry.id === document.businessId)
    const owner = users.find((entry) => entry.id === (document.ownerId || business?.ownerId))
    const ownerName = owner
      ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email
      : document.ownerId || ''
    const key = document.businessId || `owner:${document.ownerId || 'unknown'}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        business,
        businessId: document.businessId,
        businessName: business?.name || document.businessName || document.businessId || '—',
        owner,
        ownerId: document.ownerId || business?.ownerId,
        ownerName,
        ownerEmail: owner?.email || '',
        documents: [],
      })
    }
    groups.get(key).documents.push(document)
  }

  return [...groups.values()].sort((a, b) => {
    const pendingA = a.documents.some((item) =>
      ['pending_review', 'pending'].includes(item.status),
    )
    const pendingB = b.documents.some((item) =>
      ['pending_review', 'pending'].includes(item.status),
    )
    if (pendingA !== pendingB) return pendingA ? -1 : 1
    return a.businessName.localeCompare(b.businessName, undefined, { sensitivity: 'base' })
  })
}
