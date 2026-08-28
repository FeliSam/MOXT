export function findStarsPack(packages, packId) {
  const id = String(packId || '').trim()
  if (!id) return null
  return (packages || []).find((pack) => pack.id === id) || null
}

export function packTotalStars(pack) {
  return Number(pack?.stars || 0) + Number(pack?.bonus_stars || 0)
}

export function packUnitPriceRub(pack) {
  const total = packTotalStars(pack)
  const price = Number(pack?.price_rub || 0)
  if (!total || !price) return null
  return Math.round((price / total) * 10) / 10
}

export function purchaseDisplayLabel(purchase, packages = []) {
  const pack = findStarsPack(packages, purchase?.package_id || purchase?.packageId)
  if (pack?.title) return pack.title
  const stars =
    (Number(purchase?.stars) || 0) +
    (Number(purchase?.bonus_stars) || Number(purchase?.bonusStars) || 0)
  if (stars > 0) return `${stars} Stars`
  return 'MOXT Stars'
}

export function sortStarsPacks(packages = []) {
  return [...packages].sort(
    (a, b) =>
      Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
      Number(a.price_rub ?? 0) - Number(b.price_rub ?? 0),
  )
}
