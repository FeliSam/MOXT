import { setAll as setMarketplace } from './marketplaceSlice'
import { listingFromRemoteRow } from './marketplaceRemote'

/**
 * Applique immédiatement le catalogue annonces (Redux + IndexedDB).
 * Appelé dès que la réponse listings est prête, sans attendre la fin de loadAllData.
 * @returns {object[]} listings mappées
 */
export function earlyApplyMarketplaceListings(dispatch, listingsData) {
  const items = (listingsData || []).map(listingFromRemoteRow)
  dispatch(setMarketplace({ items }))
  void import('./marketplaceListingsIdb.js')
    .then(({ writeListingsToIdb }) => writeListingsToIdb(items))
    .catch(() => {})
  return items
}
