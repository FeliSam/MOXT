import { supabase } from './supabaseClient'
import { fromRow, fromRows } from './remoteRowMapper'

// Délai réseau simulé (utilisé uniquement en mode local sans Supabase).
const SIMULATED_DELAY_MS = 600

function simulateNetwork() {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))
}

function parseEndpoint(endpoint) {
  const [path, query] = endpoint.split('?')
  const params = Object.fromEntries(new URLSearchParams(query || ''))
  return { path, params }
}

function paginate(items, params) {
  const page = Number(params.page || 1)
  const limit = Number(params.limit || 20)
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    total: items.length,
    page,
    pages: Math.ceil(items.length / limit),
  }
}

// Mapping endpoint → table Supabase.
const SUPABASE_TABLE_MAP = {
  '/listings': 'listings',
  '/parcels': 'parcels',
  '/jobs': 'jobs',
  '/events': 'events',
  '/exchangers': 'exchangers',
  '/businesses': 'businesses',
  '/transfers': 'transfers',
}

// Essaie de requêter Supabase. Retourne null si la table n'existe pas encore
// (erreur 42P01 = relation inconnue → on tombe en fallback local).
async function trySupabase(path, params) {
  if (!supabase) return null

  const table = SUPABASE_TABLE_MAP[path]
  if (!table) return null

  let query = supabase.from(table).select('*')

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  }
  if (params.city) query = query.ilike('city', `%${params.city}%`)
  if (params.type) query = query.eq('type', params.type)
  if (params.sector) query = query.ilike('sector', `%${params.sector}%`)
  if (params.category) query = query.eq('category', params.category)
  if (params.status) query = query.eq('status', params.status)
  if (params.userId) query = query.eq('user_id', params.userId)

  const limit = Number(params.limit || 20)
  const page = Number(params.page || 1)
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, error, count } = await query

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST116') {
      // Table inexistante → fallback local sans bruit
      return null
    }
    throw error
  }

  return {
    items: fromRows(data ?? []),
    total: count ?? (data?.length ?? 0),
    page,
    pages: Math.ceil((count ?? data?.length ?? 0) / limit),
    source: 'supabase',
  }
}

async function trySupabaseById(table, id) {
  if (!supabase) return null
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST116') return null
    if (error.code === 'PGRST104') return { notFound: true }
    throw error
  }
  return fromRow(data)
}

// BaseQuery : Supabase d'abord, fallback local Redis si table absente.
export function createSimulatedBaseQuery() {
  return async (endpoint, api) => {
    try {
      const { path, params } = parseEndpoint(endpoint)
      const state = api.getState()

      // --- Tentative Supabase (idempotente, sans erreur visible) ---
      // Toute panne reseau/CSP/CORS retombe sur les donnees locales au lieu
      // de faire echouer la requete : Supabase est une amelioration, jamais
      // un point de defaillance unique.
      let sbResult = null
      try {
        sbResult = await trySupabase(path, params)
      } catch {
        sbResult = null
      }
      if (sbResult) return { data: { ...sbResult } }

      // Requête par ID via Supabase
      const idMatch = path.match(/^\/([^/]+)\/([^/]+)$/)
      if (idMatch) {
        const [, resource, id] = idMatch
        const tableMap = {
          listings: 'listings',
          parcels: 'parcels',
          jobs: 'jobs',
          events: 'events',
          businesses: 'businesses',
        }
        const table = tableMap[resource]
        if (table) {
          let sbItem = null
          try {
            sbItem = await trySupabaseById(table, id)
          } catch {
            sbItem = null
          }
          if (sbItem?.notFound)
            return { error: { status: 404, data: `${resource} introuvable` } }
          if (sbItem) return { data: sbItem }
        }
      }

      // --- Fallback local (données Redux) ---
      await simulateNetwork()

      if (path === '/listings') {
        let items = state.marketplace.items.filter((item) => item.status === 'active')
        if (params.q) {
          const q = params.q.toLowerCase()
          items = items.filter(
            (i) =>
              i.title?.toLowerCase().includes(q) ||
              i.category?.toLowerCase().includes(q) ||
              i.city?.toLowerCase().includes(q),
          )
        }
        if (params.city) items = items.filter((i) => i.city?.toLowerCase().includes(params.city.toLowerCase()))
        if (params.type) items = items.filter((i) => i.type === params.type)
        return { data: paginate(items, params) }
      }

      if (idMatch) {
        const [, resource, id] = idMatch
        const storeMap = {
          listings: state.marketplace.items,
          parcels: state.parcels.items,
          jobs: state.jobs.items,
          events: state.events.items,
          businesses: state.businesses.items,
        }
        const list = storeMap[resource]
        if (list) {
          const item = list.find((i) => i.id === id)
          return item ? { data: item } : { error: { status: 404, data: 'Introuvable' } }
        }
      }

      if (path === '/parcels') {
        let items = state.parcels.items.filter((i) => i.status === 'active')
        if (params.origin) items = items.filter((i) => i.origin?.toLowerCase().includes(params.origin.toLowerCase()))
        if (params.destination) items = items.filter((i) => i.destination?.toLowerCase().includes(params.destination.toLowerCase()))
        return { data: paginate(items, params) }
      }

      if (path === '/jobs') {
        let items = state.jobs.items.filter((i) => i.status === 'active')
        if (params.q) {
          const q = params.q.toLowerCase()
          items = items.filter((i) => i.title?.toLowerCase().includes(q) || i.sector?.toLowerCase().includes(q))
        }
        return { data: paginate(items, params) }
      }

      if (path === '/events') {
        let items = state.events.items.filter((i) => i.status === 'published')
        if (params.city) items = items.filter((i) => i.city?.toLowerCase().includes(params.city.toLowerCase()))
        if (params.category) items = items.filter((i) => i.category === params.category)
        return { data: paginate(items, params) }
      }

      if (path === '/exchangers') {
        const items = state.businesses.items.filter(
          (i) => i.services?.includes('Transfert') && ['verified', 'approved', 'active'].includes(i.status),
        )
        return { data: paginate(items, params) }
      }

      if (path === '/businesses') {
        const items = state.businesses.items.filter((i) => ['verified', 'approved', 'active'].includes(i.status))
        return { data: paginate(items, params) }
      }

      if (path === '/transfers') {
        const items = params.userId
          ? state.transfers.items.filter((i) => i.userId === params.userId)
          : state.transfers.items
        return { data: paginate(items, params) }
      }

      return { error: { status: 404, data: `Endpoint inconnu : ${path}` } }
    } catch (error) {
      return { error: { status: 'FETCH_ERROR', error: String(error) } }
    }
  }
}
