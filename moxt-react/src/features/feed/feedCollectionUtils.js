/** Garantit un tableau (localStorage / API parfois renvoient un objet). */
export function asArray(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  if (typeof value === 'object') return Object.values(value)
  return []
}

/** Map id → row, même si la source est déjà une Map ou un objet indexé. */
export function asIdLookup(rows) {
  if (rows instanceof Map) return rows
  const map = new Map()
  for (const row of asArray(rows)) {
    if (row?.id != null) map.set(row.id, row)
  }
  return map
}

/** Lit un paramètre d’URL même si la valeur n’est pas une URLSearchParams. */
export function readSearchParam(params, key, fallback = '') {
  if (params instanceof URLSearchParams) {
    return params.get(key) || fallback
  }
  if (params && typeof params.get === 'function') {
    return params.get(key) || fallback
  }
  return fallback
}
