import { isPoolBonusCredit } from './starsHistoryUtils'

export const STARS_NOTIFY_PREFIX = 'NOT-STARS-'
const SEEN_KEY_PREFIX = 'moxt-stars-notified-tx:'
const SEEN_CAP = 400

export function starsNotifyId(item) {
  const key = String(item?.idempotency_key || item?.id || '').trim()
  if (!key) return null
  return `${STARS_NOTIFY_PREFIX}${key}`.slice(0, 60)
}

export function starsNotifyIdFromKey(key) {
  const normalized = String(key || '').trim()
  if (!normalized) return null
  return `${STARS_NOTIFY_PREFIX}${normalized}`.slice(0, 60)
}

export function classifyStarsNotify(item) {
  if (!item) return 'credit'
  const refType = String(item.ref_type || '')
  const category = String(item.category || '')
  const isCredit = item.kind === 'credit'

  if (isCredit) {
    if (refType === 'purchase') return 'purchase'
    if (refType === 'referral') return 'referral'
    if (refType === 'gift' || category === 'gift') return 'giftReceived'
    if (isPoolBonusCredit(item) || refType === 'monthly_grant' || refType === 'rollout_topup') {
      return 'pool'
    }
    return 'credit'
  }

  if (refType === 'gift' || category === 'gift') return 'giftSent'
  return 'spend'
}

export function starsNotifyCopy(kind, amount, t, detail = '') {
  const n = Number(amount) || 0
  const extra = String(detail || '').trim()
  const withDetail = (body) => (extra && extra !== body ? `${body} ${extra}`.trim() : body)

  switch (kind) {
    case 'purchase':
      return {
        title: t('notificationsFeed.starsPurchase'),
        message: t('notificationsFeed.starsPurchaseBody', { n }),
        priority: 'high',
      }
    case 'referral':
      return {
        title: t('notificationsFeed.starsReferral'),
        message: withDetail(t('notificationsFeed.starsReferralBody', { n })),
        priority: 'high',
      }
    case 'pool':
      return {
        title: t('notificationsFeed.starsPool'),
        message: t('notificationsFeed.starsPoolBody', { n }),
        priority: 'normal',
      }
    case 'giftReceived':
      return {
        title: t('notificationsFeed.starsGiftReceived'),
        message: withDetail(t('notificationsFeed.starsGiftReceivedBody', { n })),
        priority: 'high',
      }
    case 'giftSent':
      return {
        title: t('notificationsFeed.starsGiftSent'),
        message: t('notificationsFeed.starsGiftSentBody', { n }),
        priority: 'normal',
      }
    case 'spend':
      return {
        title: t('notificationsFeed.starsSpend'),
        message: withDetail(t('notificationsFeed.starsSpendBody', { n })),
        priority: 'normal',
      }
    default:
      return {
        title: t('notificationsFeed.starsCredit'),
        message: withDetail(t('notificationsFeed.starsCreditBody', { n })),
        priority: 'high',
      }
  }
}

export function seenStorageKey(userId) {
  return `${SEEN_KEY_PREFIX}${userId}`
}

export function readStarsSeenIds(userId) {
  if (!userId || typeof localStorage === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(seenStorageKey(userId)) || '[]')
    return Array.isArray(raw) ? raw.map(String).filter(Boolean) : []
  } catch {
    return []
  }
}

export function writeStarsSeenIds(userId, ids) {
  if (!userId || typeof localStorage === 'undefined') return
  try {
    const unique = [...new Set((ids || []).map(String).filter(Boolean))]
    localStorage.setItem(seenStorageKey(userId), JSON.stringify(unique.slice(-SEEN_CAP)))
  } catch {
    // ignore quota / private mode
  }
}

export function markStarsNotifySeen(userId, ids) {
  const next = [...readStarsSeenIds(userId), ...(ids || [])]
  writeStarsSeenIds(userId, next)
}

/** First sync seeds existing ledger rows so we do not flood the bell. Later rows are notified. */
export function takeUnseenStarsTransactions(transactions = [], seenIds = []) {
  const rows = Array.isArray(transactions) ? transactions.filter((item) => item?.id) : []
  const seen = new Set((seenIds || []).map(String))
  const allIds = rows.map((item) => starsNotifyId(item)).filter(Boolean)

  if (seen.size === 0) {
    return { mode: 'seed', items: [], markIds: allIds }
  }

  const items = rows.filter((item) => {
    const id = starsNotifyId(item)
    if (!id) return false
    if (seen.has(id) || seen.has(String(item.id))) return false
    const key = String(item.idempotency_key || '')
    if (/:(paid|bonus)$/i.test(key) && seen.has(starsNotifyIdFromKey(key.replace(/:(paid|bonus)$/i, '')))) {
      return false
    }
    return true
  })

  return { mode: 'notify', items, markIds: items.map((item) => starsNotifyId(item)).filter(Boolean) }
}
