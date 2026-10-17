import { setAll as setMarketplace } from './marketplaceSlice'
import { listingFromRemoteRow } from './marketplaceRemote'

/**
 * Applique immédiatement le catalogue annonces (Redux + IndexedDB).
 * Appelé dès que la réponse listings est prête, sans attendre la fin de loadAllData.
 * @returns {object[]} listings mappées
 */
export function earlyApplyMarketplaceListings(dispatch, listingsData, mode, getMergedItems) {
  const items = (listingsData || []).map(listingFromRemoteRow)
  dispatch(setMarketplace({ items, mode }))
  void import('./marketplaceListingsIdb.js')
    .then(({ writeListingsToIdb }) => {
      const fullList = typeof getMergedItems === 'function' ? getMergedItems() : items
      return writeListingsToIdb(fullList)
    })
    .catch(() => {})
  return items
}
