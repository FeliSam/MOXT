/** Code pays préféré de l'utilisateur (origine ou résidence). */
export function resolveUserCountryCode(user) {
  if (!user) return null
  return user.originCountry || user.country || null
}

/** 0 = même pays que l'utilisateur, 1 = autre pays, 2 = pays inconnu. */
export function countrySortRank(itemCountry, preferredCountry) {
  if (!preferredCountry) return 0
  if (!itemCountry) return 2
  return String(itemCountry).toUpperCase() === String(preferredCountry).toUpperCase() ? 0 : 1
}

/**
 * Trie les éléments : pays de l'utilisateur d'abord, puis les autres, puis date décroissante.
 * @param {Array} items
 * @param {string|null} preferredCountry
 * @param {(item: unknown) => string|null|undefined} getCountry
 */
export function sortByCountryPriority(items, preferredCountry, getCountry) {
  return [...items].sort((left, right) => {
    const rankLeft = countrySortRank(getCountry(left), preferredCountry)
    const rankRight = countrySortRank(getCountry(right), preferredCountry)
    if (rankLeft !== rankRight) return rankLeft - rankRight
    const dateLeft = new Date(left.updatedAt || left.createdAt || 0).getTime()
    const dateRight = new Date(right.updatedAt || right.createdAt || 0).getTime()
    return dateRight - dateLeft
  })
}
