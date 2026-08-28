import { BONUS_POOL_CATEGORY, STARS_CATEGORIES } from './starsConfig'

/** Crédit mensuel du pool bonus (v2) ou ancien quota par catégorie (v1). */
export function isMonthlyBonusGrant(item) {
  if (!item || item.kind !== 'credit' || item.star_type !== 'bonus') return false
  if (item.ref_type === 'monthly_grant') return true
  if (item.ref_type === 'rollout_topup') return true
  const reason = String(item.reason || '').toLowerCase()
  return reason.includes('pool bonus') || reason.includes('quota bonus')
}

/** Crédit pool bonus v2 (pool unique). */
export function isPoolBonusCredit(item) {
  if (!item || item.kind !== 'credit' || item.star_type !== 'bonus') return false
  const category = String(item.category || '')
  if (category === 'pool' || category === BONUS_POOL_CATEGORY) return true
  return isMonthlyBonusGrant(item) && !isLegacyCategoryMonthlyGrant(item)
}

/** Anciens crédits v1 par catégorie — masqués au profit du pool unique. */
export function isLegacyCategoryMonthlyGrant(item) {
  if (!isMonthlyBonusGrant(item)) return false
  const category = String(item.category || '')
  return category !== 'pool' && category !== BONUS_POOL_CATEGORY
}

function periodKey(item) {
  if (item?.ref_id && /^\d{6}$/.test(String(item.ref_id))) return String(item.ref_id)
  if (!item?.created_at) return 'unknown'
  const date = new Date(item.created_at)
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${date.getUTCFullYear()}${month}`
}

/** Fusionne les crédits pool du même mois (grant initial + complément rollout). */
export function consolidatePoolGrants(transactions = []) {
  const merged = new Map()
  const rest = []

  for (const item of transactions) {
    if (!isPoolBonusCredit(item)) {
      rest.push(item)
      continue
    }
    const key = periodKey(item)
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, {
        ...item,
        amount: Number(item.amount) || 0,
        id: item.id || `pool-${key}`,
      })
      continue
    }
    existing.amount += Number(item.amount) || 0
    if (item.created_at && (!existing.created_at || item.created_at > existing.created_at)) {
      existing.created_at = item.created_at
    }
  }

  return [...merged.values(), ...rest]
}

/** Historique affichable : pool mensuel, achats, dépenses — pas les quotas v1 par catégorie. */
export function normalizeStarsHistory(transactions = []) {
  const filtered = (Array.isArray(transactions) ? transactions : []).filter(
    (item) => !isLegacyCategoryMonthlyGrant(item),
  )
  return consolidatePoolGrants(filtered).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  )
}

export function purchaseLabelFromReason(reason, packages = []) {
  const match = String(reason || '').match(/Achat pack\s+(\S+)/i)
  if (!match) return reason || null
  const packId = match[1]
  const pack = (packages || []).find((row) => row.id === packId)
  if (pack?.title) return pack.title
  const stars = Number(pack?.stars || 0) + Number(pack?.bonus_stars || 0)
  if (stars > 0) return `${stars} Stars`
  return packId
}

export function historyEntryMeta(item, t, packages = []) {
  const isCredit = item?.kind === 'credit'
  const amount = Number(item?.amount) || 0

  if (isCredit && item.ref_type === 'purchase') {
    return {
      isCredit: true,
      amount,
      headline: t('stars.historyPurchase'),
      detail: purchaseLabelFromReason(item.reason, packages) || t('stars.purchaseLine'),
      poolGrant: false,
      showCategoryBadge: false,
      categoryKey: 'purchase',
      starType: 'paid',
    }
  }

  if (isCredit && item.ref_type === 'referral') {
    return {
      isCredit: true,
      amount,
      headline: t('stars.historyReferral'),
      detail: item?.reason || null,
      poolGrant: false,
      showCategoryBadge: false,
      categoryKey: 'referral',
      starType: 'paid',
    }
  }

  if (isCredit && (item.ref_type === 'gift' || item.category === 'gift')) {
    return {
      isCredit: true,
      amount,
      headline: t('stars.historyGiftReceived'),
      detail: item?.reason || null,
      poolGrant: false,
      showCategoryBadge: false,
      categoryKey: 'gift',
      starType: 'paid',
    }
  }

  if (isPoolBonusCredit(item)) {
    return {
      isCredit: true,
      amount,
      headline: t('stars.historyPoolGrant'),
      detail: null,
      poolGrant: true,
      showCategoryBadge: true,
      categoryKey: 'pool',
      starType: 'bonus',
    }
  }

  if (!isCredit) {
    const category = String(item?.category || item?.ref_type || '')
    let headline = t('stars.historySpendGeneric')

    if (item?.ref_type === 'gift' || category === 'gift') {
      headline = t('stars.historyGiftSent')
    } else if (item?.ref_type === 'boost' || category === 'boost') {
      headline = t('stars.historySpendBoost')
    } else if (category === 'status') {
      headline = t('stars.historySpendStatus')
    } else if (STARS_CATEGORIES.includes(category)) {
      headline = t('stars.historySpendPublish', {
        category: t(`stars.categories.${category}`),
      })
    }

    return {
      isCredit: false,
      amount,
      headline,
      detail: item?.reason || null,
      poolGrant: false,
      showCategoryBadge: Boolean(category) && category !== 'pool',
      categoryKey: category,
      starType: item?.star_type || 'bonus',
    }
  }

  return {
    isCredit: true,
    amount,
    headline: item?.reason || t('stars.historyCredit'),
    detail: null,
    poolGrant: false,
    showCategoryBadge: Boolean(item?.category),
    categoryKey: item?.category,
    starType: item?.star_type || 'paid',
  }
}

/** @deprecated use historyEntryMeta */
export function historyRowPresentation(item) {
  const poolGrant = isPoolBonusCredit(item)
  return {
    poolGrant,
    showCategoryBadge: Boolean(item?.category) && !poolGrant,
  }
}
