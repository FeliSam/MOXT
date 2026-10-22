import { entityFromRemoteRow, rowsOrEmpty } from './rowUtils.js'
import { fromRow } from '../utils/remoteRowMapper.js'
import {
  collectUserPublicationsFromCatalogs,
  emptyPublications,
  filterPublicationsByScope,
  isActiveListing,
  publicationArchiveCounts,
  publicationTypeCounts,
} from '../domain/publicationRules.js'

export const OWN_PUBLICATIONS_LIMIT = 200

const OWNER_TABLES = [
  ['listings', 'listings', 'owner_id'],
  ['parcels', 'parcels', 'owner_id'],
  ['jobs', 'jobs', 'owner_id'],
  ['events', 'events', 'owner_id'],
  ['videos', 'videos', 'owner_id'],
  ['posts', 'posts', 'author_id'],
  ['others', 'p2p_offers', 'owner_id'],
]

/**
 * Toutes les publications du compte (actives + archivées, toutes catégories dont « Autres » = offres P2P).
 * Le web sélectionne par propriétaire dans ses catalogues chargés ; ici on interroge directement
 * par owner_id / author_id (mêmes tables, mêmes règles d’archive) pour ne rien perdre au-delà
 * des limites de catalogue.
 */
export async function fetchUserPublications(client, userId, { limit = OWN_PUBLICATIONS_LIMIT } = {}) {
  if (!client || !userId) return { publications: emptyPublications(), errors: [] }
  const results = await Promise.all(
    OWNER_TABLES.map(([, table, column]) =>
      client.from(table).select('*').eq(column, userId).order('created_at', { ascending: false }).limit(limit),
    ),
  )
  const publications = emptyPublications()
  const errors = []
  OWNER_TABLES.forEach(([key, table], index) => {
    const result = results[index]
    if (result?.error) errors.push({ table, message: result.error.message })
    publications[key] = rowsOrEmpty(result).map(entityFromRemoteRow).filter(Boolean)
  })
  return { publications, errors }
}

/** Résumé « Mes publications » comme la page web (portée personnelle, en attente comptée en actif). */
export function summarizeUserPublications(publications, { scope = 'personal', includePending = true } = {}) {
  const scoped = filterPublicationsByScope(publications, scope)
  return {
    scoped,
    archiveCounts: publicationArchiveCounts(scoped, { includePending }),
    activeTypeCounts: publicationTypeCounts(scoped, 'active', { includePending }),
    archivedTypeCounts: publicationTypeCounts(scoped, 'archived', { includePending }),
  }
}

export { fromRow }

/** Même fenêtre que le web (LISTINGS_PUBLIC_LIMIT) pour le catalogue des annonces. */
export const LISTINGS_PUBLIC_LIMIT = 500

/** Catalogue annonces comme le web (500 plus récentes, RLS), filtré sur les annonces actives. */
export async function fetchActiveListings(client, { limit = LISTINGS_PUBLIC_LIMIT } = {}) {
  if (!client) return []
  const result = await client.from('listings').select('*').order('created_at', { ascending: false }).limit(limit)
  if (result.error) throw result.error
  return (result.data || []).filter((row) => isActiveListing(row))
}

/**
 * Publications visibles d’un profil public, mêmes filtres que fetchGuestUserPreview du web :
 * statuts publics seulement, et aucune offre P2P (`others` reste vide).
 * Le compteur « Mes publications » (fetchUserPublications) reste plus large : toutes les
 * statuts, y compris les brouillons et les offres.
 */
const PUBLIC_USER_TABLES = [
  ['listings', 'listings', 'owner_id', ['active']],
  ['parcels', 'parcels', 'owner_id', ['active', 'full']],
  ['jobs', 'jobs', 'owner_id', ['active']],
  ['events', 'events', 'owner_id', ['published']],
  ['videos', 'videos', 'owner_id', ['active']],
  ['posts', 'posts', 'author_id', ['published']],
]

/**
 * Catalogue du profil public authentifié, mêmes fenêtres que loadAllData du web
 * (annonces 500, autres tables 50, posts 40), puis sélection par propriétaire.
 * Pas de filtre de statut sur les fenêtres : les archives du catalogue comptent.
 * La requête posts est celle du web (auteur = visiteur connecté). Si elle échoue
 * (visiteur e2e hors UUID, colonne absente), les posts restent vides, comme le
 * setPosts du web sur une réponse en erreur.
 */
export async function fetchCatalogUserPublications(client, userId, { viewerId } = {}) {
  if (!client || !userId) return { publications: emptyPublications(), errors: [] }
  const windows = [
    ['listings', 'listings', LISTINGS_PUBLIC_LIMIT],
    ['parcels', 'parcels', 50],
    ['jobs', 'jobs', 50],
    ['events', 'events', 50],
    ['videos', 'videos', 50],
    ['others', 'p2p_offers', 50],
  ]
  const windowResults = await Promise.all(
    windows.map(([, table, limit]) =>
      client.from(table).select('*').order('created_at', { ascending: false }).limit(limit),
    ),
  )
  const postsResult = viewerId
    ? await client
        .from('posts')
        .select('*')
        .or(`status.eq.published,author_id.eq.${viewerId}`)
        .order('last_shared_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(40)
    : await client.from('posts').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(40)

  const catalogs = emptyPublications()
  const errors = []
  windows.forEach(([key, table], index) => {
    const result = windowResults[index]
    if (result?.error) errors.push({ table, message: result.error.message })
    catalogs[key] = rowsOrEmpty(result).map(entityFromRemoteRow).filter(Boolean)
  })
  if (postsResult?.error) errors.push({ table: 'posts', message: postsResult.error.message })
  catalogs.posts = rowsOrEmpty(postsResult).map(entityFromRemoteRow).filter(Boolean)
  return { publications: collectUserPublicationsFromCatalogs(catalogs, userId), errors }
}

export async function fetchPublicUserPublications(client, userId) {
  if (!client || !userId) return { publications: emptyPublications(), errors: [] }
  const results = await Promise.all(
    PUBLIC_USER_TABLES.map(([, table, column, statuses]) => {
      const query = client.from(table).select('*').eq(column, userId)
      return statuses.length === 1 ? query.eq('status', statuses[0]) : query.in('status', statuses)
    }),
  )
  const publications = emptyPublications()
  const errors = []
  PUBLIC_USER_TABLES.forEach(([key, table], index) => {
    const result = results[index]
    if (result?.error) errors.push({ table, message: result.error.message })
    publications[key] = rowsOrEmpty(result).map(entityFromRemoteRow).filter(Boolean)
  })
  return { publications, errors }
}

/** Tables et statuts publics lus pour une page entreprise (mêmes requêtes que l’aperçu entreprise du web). */
const BUSINESS_TABLES = [
  ['listings', 'listings', ['active']],
  ['parcels', 'parcels', ['active', 'full']],
  ['jobs', 'jobs', ['active']],
  ['events', 'events', ['published']],
  ['videos', 'videos', ['active']],
]

/**
 * Publications visibles d’une entreprise (business_id), comme fetchGuestBusinessPreview du web.
 * Les posts du fil ne sont pas rattachés à une entreprise : liste vide, comme sur le web.
 */
export async function fetchBusinessPublications(client, businessId) {
  if (!client || !businessId) return { publications: emptyPublications(), errors: [] }
  const results = await Promise.all(
    BUSINESS_TABLES.map(([, table, statuses]) => {
      const query = client.from(table).select('*').eq('business_id', businessId)
      return statuses.length === 1 ? query.eq('status', statuses[0]) : query.in('status', statuses)
    }),
  )
  const publications = emptyPublications()
  const errors = []
  BUSINESS_TABLES.forEach(([key, table], index) => {
    const result = results[index]
    if (result?.error) errors.push({ table, message: result.error.message })
    publications[key] = rowsOrEmpty(result).map(entityFromRemoteRow).filter(Boolean)
  })
  return { publications, errors }
}
