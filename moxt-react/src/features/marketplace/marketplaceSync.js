import { supabase } from '../../services/supabaseClient'
import { setAll } from './marketplaceSlice'
import { listingFromRemoteRow } from './marketplaceRemote'
import { readListingsFromIdb, writeListingsToIdb } from './marketplaceListingsIdb'
import { LISTINGS_PUBLIC_LIMIT } from '../../app/catalogConstants'

/**
 * Calcule le timestamp le plus récent parmi les annonces en cache.
 */
export function getLatestListingTimestamp(listings = []) {
  let maxTime = 0
  const maxAllowed = Date.now() + 60000
  for (const item of listings) {
    const raw = item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at
    if (!raw) continue
    const t = Date.parse(raw)
    if (t > maxTime && t <= maxAllowed) maxTime = t
  }
  return maxTime > 0 ? new Date(maxTime).toISOString() : null
}

let syncInProgress = false

/**
 * Synchronisation intelligente & incrémentale du catalogue Marketplace :
 * 1. Hydrate d'abord immédiatement depuis IndexedDB si Redux est vide.
 * 2. Si le cache local contient déjà les annonces, interroge Supabase UNIQUEMENT
 *    pour les annonces créées ou modifiées après le dernier timestamp (delta sync).
 * 3. Ne télécharge tout le catalogue (jusqu'à 500) que lors de la toute première visite
 *    ou lors d'un pull-to-refresh explicite (`force: true`).
 */
export async function syncMarketplaceCatalog(dispatch, store, { force = false } = {}) {
  if (syncInProgress) return
  syncInProgress = true

  try {
    const currentState = store.getState()
    let currentListings = currentState?.marketplace?.items || []

    // 1. Hydratation immédiate depuis le stockage local (IndexedDB)
    if (currentListings.length === 0) {
      const cached = await readListingsFromIdb()
      if (cached && cached.length > 0) {
        currentListings = cached
        dispatch(setAll({ items: cached, mode: 'merge' }))
      }
    }

    if (!supabase) return

    // 2. Synchronisation Delta si un catalogue sain de vraies annonces existe déjà en local
    const realListings = currentListings.filter(
      (item) => item?.id && !String(item.id).startsWith('ANN-DEMO-')
    )

    const latestTimestamp =
      !force && realListings.length >= 25
        ? getLatestListingTimestamp(realListings)
        : null

    if (latestTimestamp) {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .or(`updated_at.gt.${latestTimestamp},created_at.gt.${latestTimestamp}`)
        .order('updated_at', { ascending: false })
        .limit(100)

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          // Fusionne uniquement les nouveaux ou modifiés sans toucher au reste
          const deltaItems = data.map(listingFromRemoteRow)
          dispatch(setAll({ items: deltaItems, mode: 'merge' }))
          const nextItems = store.getState()?.marketplace?.items || []
          void writeListingsToIdb(nextItems)
        }
        // data.length === 0 : catalogue déjà 100 % à jour, aucun re-render inutile !
        return
      }
    }

    // 3. Téléchargement initial complet ou forcé
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(LISTINGS_PUBLIC_LIMIT)

    if (!error && Array.isArray(data) && data.length > 0) {
      const items = data.map(listingFromRemoteRow)
      dispatch(setAll({ items, mode: 'merge' }))
      const nextItems = store.getState()?.marketplace?.items || []
      void writeListingsToIdb(nextItems.length ? nextItems : items)
    }
  } catch (err) {
    console.warn('[MarketplaceSync] Erreur sync delta:', err)
  } finally {
    syncInProgress = false
  }
}

/**
 * Vérification d'intégrité et auto-rattrapage (Auto-Healing) :
 * 1. Fait une requête HEAD de comptage exact sur Supabase (.eq('status', 'active')).
 * 2. Compare avec le nombre d'annonces actives réellement en cache/Redux.
 * 3. Si le cache a moins d'annonces que la base, télécharge immédiatement la totalité
 *    des annonces actives de la base et rafraîchit le store + IDB.
 */
export async function verifyAndReconcileMarketplaceCatalog(dispatch, store) {
  if (!supabase) return { ok: false, reason: 'no-supabase' }

  try {
    const { count: remoteActiveCount, error: countErr } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (countErr || typeof remoteActiveCount !== 'number') {
      return { ok: false, error: countErr }
    }

    const state = store.getState()
    const currentListings = state?.marketplace?.items || []
    const localActive = currentListings.filter(
      (item) => item?.status === 'active' && item?.id && !String(item.id).startsWith('ANN-DEMO-')
    )

    if (localActive.length < remoteActiveCount) {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(LISTINGS_PUBLIC_LIMIT)

      if (!error && Array.isArray(data) && data.length > 0) {
        const items = data.map(listingFromRemoteRow)
        dispatch(setAll({ items, mode: 'merge' }))
        const nextItems = store.getState()?.marketplace?.items || []
        void writeListingsToIdb(nextItems.length ? nextItems : items)
        return { ok: true, reconciled: true, count: items.length }
      }
    }

    return { ok: true, reconciled: false, count: localActive.length }
  } catch (err) {
    console.warn('[MarketplaceSync] Erreur réconciliation d’intégrité:', err)
    return { ok: false, error: err }
  }
}
