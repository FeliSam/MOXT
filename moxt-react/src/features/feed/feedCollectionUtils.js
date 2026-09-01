/** Garantit un tableau (localStorage / API parfois renvoient un objet). */
export function asArray(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  if (value instanceof Map) return [...value.values()]
  if (typeof value === 'object') return Object.values(value)
  return []
}

function looksLikeFeedItemKey(key) {
  return typeof key === 'string' && key.includes(':')
}

/** Map sûre — évite `.get is not a function` si la source est un objet JSON corrompu. */
export function ensureMap(value) {
  if (value instanceof Map) return value
  if (!value || typeof value !== 'object') return new Map()
  if (Array.isArray(value)) {
    if (value.length && Array.isArray(value[0]) && value[0].length >= 2) {
      return new Map(value)
    }
    const map = new Map()
    for (const row of value) {
      if (row?.id != null) map.set(String(row.id), row)
    }
    return map
  }
  const entries = Object.entries(value)
  if (entries.length && entries.every(([key]) => looksLikeFeedItemKey(key))) {
    return new Map(entries)
  }
  return new Map()
}

export function mapHas(map, key) {
  return typeof map?.has === 'function' && map.has(key)
}

export function mapGet(map, key, fallback = undefined) {
  return mapHas(map, key) ? map.get(key) : fallback
}

/** Map id → row, même si la source est déjà une Map ou un objet indexé. */
export function asIdLookup(rows) {
  if (rows instanceof Map) return rows
  const map = new Map()
  for (const row of asArray(rows)) {
    if (row?.id != null) map.set(String(row.id), row)
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
