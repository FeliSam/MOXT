import {
  FiBriefcase,
  FiCalendar,
  FiPackage,
  FiShoppingBag,
  FiVideo,
  FiZap,
} from 'react-icons/fi'
import { BONUS_POOL_CATEGORY } from './starsConfig'

/** Métadonnées visuelles des catégories Stars (icône + teinte). */
export const STARS_CATEGORY_META = {
  marketplace: {
    icon: FiShoppingBag,
    ring: 'ring-amber-400/30',
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    soft: 'bg-amber-500/10 text-amber-800 dark:text-amber-200',
  },
  jobs: {
    icon: FiBriefcase,
    ring: 'ring-emerald-400/30',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    bar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    soft: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
  },
  events: {
    icon: FiCalendar,
    ring: 'ring-violet-400/30',
    iconBg: 'bg-gradient-to-br from-violet-400 to-purple-600',
    bar: 'bg-gradient-to-r from-violet-400 to-purple-500',
    soft: 'bg-violet-500/10 text-violet-800 dark:text-violet-200',
  },
  parcel: {
    icon: FiPackage,
    ring: 'ring-sky-400/30',
    iconBg: 'bg-gradient-to-br from-sky-400 to-blue-600',
    bar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    soft: 'bg-sky-500/10 text-sky-800 dark:text-sky-200',
  },
  video: {
    icon: FiVideo,
    ring: 'ring-rose-400/30',
    iconBg: 'bg-gradient-to-br from-rose-400 to-red-600',
    bar: 'bg-gradient-to-r from-rose-400 to-red-500',
    soft: 'bg-rose-500/10 text-rose-800 dark:text-rose-200',
  },
  status: {
    icon: FiZap,
    ring: 'ring-cyan-400/30',
    iconBg: 'bg-gradient-to-br from-cyan-400 to-brand-600',
    bar: 'bg-gradient-to-r from-cyan-400 to-brand-500',
    soft: 'bg-cyan-500/10 text-cyan-800 dark:text-cyan-200',
  },
  boost: {
    icon: FiZap,
    ring: 'ring-amber-400/30',
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-600',
    bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    soft: 'bg-amber-500/10 text-amber-800 dark:text-amber-200',
  },
}

export function formatStarsPeriod(period, locale = 'fr') {
  if (!period || String(period).length !== 6) return ''
  const year = Number(String(period).slice(0, 4))
  const month = Number(String(period).slice(4, 6)) - 1
  const date = new Date(Date.UTC(year, month, 1))
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date)
  } catch {
    return String(period)
  }
}

export function sumBonusBalances(bonus = {}, balancePayload = null) {
  if (balancePayload?.bonusPool != null) {
    return Number(balancePayload.bonusPool) || 0
  }
  const pool = Number(bonus.pool ?? bonus[BONUS_POOL_CATEGORY] ?? 0)
  if (pool > 0) return pool
  return Object.values(bonus).reduce((total, value) => total + Number(value || 0), 0)
}

/** Total Stars utilisables (Paid partagé + pools bonus perso et entreprise). */
export function totalStarsAvailable(balance) {
  if (!balance) return 0
  if (balance.combinedTotal != null) return Number(balance.combinedTotal) || 0
  const paid = Number(balance.paid ?? balance.sharedPaid ?? 0)
  const personal = Number(balance.personalBonus ?? 0)
  const business = Number(balance.businessBonus ?? 0)
  if (balance.personalBonus != null || balance.businessBonus != null) {
    return paid + personal + business
  }
  return paid + sumBonusBalances(balance.bonus || {}, balance)
}

export function combinedBonusRemaining(balance) {
  if (!balance) return 0
  const personal = Number(balance.personalBonus ?? 0)
  const business = Number(balance.businessBonus ?? 0)
  if (balance.personalBonus != null || balance.businessBonus != null) {
    return personal + business
  }
  return sumBonusBalances(balance.bonus || {}, balance)
}

/** Valeurs d’affichage cohérentes (portefeuille, dashboard, header). */
export function resolveWalletDisplay(balance, { monthlyQuotaForPlan } = {}) {
  const paid = Number(balance?.sharedPaid ?? balance?.paid ?? 0)
  const personalBonus = Number(
    balance?.personalBonus ?? (balance?.businessBonus != null ? 0 : balance?.bonusPool) ?? 0,
  )
  const businessBonus = Number(balance?.businessBonus ?? 0)
  const linkedBusiness = Boolean(balance?.linkedBusinessId)
  const bonusTotal = personalBonus + (linkedBusiness ? businessBonus : 0)
  const personalQuota = Number(
    balance?.personalBonusGranted ??
      (monthlyQuotaForPlan ? monthlyQuotaForPlan('user', balance?.config) : 0) ??
      0,
  )
  const businessQuota = Number(
    balance?.businessBonusGranted ??
      (monthlyQuotaForPlan ? monthlyQuotaForPlan('business', balance?.config) : 0) ??
      0,
  )
  return {
    paid,
    personalBonus,
    businessBonus,
    linkedBusiness,
    bonusTotal,
    total: totalStarsAvailable(balance),
    personalQuota,
    businessQuota,
    bonusQuota: personalQuota + (linkedBusiness ? businessQuota : 0),
  }
}

/** Fusionne le solde perso avec le pool entreprise (RPC v1 sans linkedBusinessId). */
export function mergeLinkedWalletBalances(personalPayload, businessPayload, linkedBusinessId) {
  const personalBonus = Number(personalPayload?.personalBonus ?? personalPayload?.bonusPool ?? 0)
  const businessBonus = Number(
    businessPayload?.businessBonus ?? businessPayload?.bonusPool ?? businessPayload?.personalBonus ?? 0,
  )
  const paid = Number(personalPayload?.sharedPaid ?? personalPayload?.paid ?? 0)
  const personalGranted = Number(
    personalPayload?.personalBonusGranted ??
      personalPayload?.bonusPoolGranted ??
      personalPayload?.quotas?.pool ??
      0,
  )
  const businessGranted = Number(
    businessPayload?.businessBonusGranted ??
      businessPayload?.bonusPoolGranted ??
      businessPayload?.quotas?.pool ??
      0,
  )
  return {
    ...personalPayload,
    linkedBusinessId,
    personalBonus,
    businessBonus,
    personalBonusGranted: personalGranted,
    businessBonusGranted: businessGranted,
    sharedPaid: paid,
    paid,
    bonusPool: personalBonus + businessBonus,
    bonusPoolGranted: personalGranted + businessGranted,
    combinedTotal: paid + personalBonus + businessBonus,
  }
}

/** Styles visuels des packs d’achat Stars. */
export const STARS_PACK_META = {
  'pack-25': {
    gradient: 'from-zinc-500 to-zinc-700',
    glow: 'bg-zinc-400',
    badge: null,
  },
  'pack-50': {
    gradient: 'from-slate-600 to-slate-800',
    glow: 'bg-slate-400',
    badge: null,
  },
  'pack-150': {
    gradient: 'from-brand-600 to-cyan-600',
    glow: 'bg-cyan-400',
    badge: 'popular',
  },
  'pack-250': {
    gradient: 'from-indigo-600 to-blue-700',
    glow: 'bg-indigo-400',
    badge: null,
  },
  'pack-400': {
    gradient: 'from-amber-500 via-brand-600 to-violet-700',
    glow: 'bg-amber-400',
    badge: null,
  },
  'pack-1000': {
    gradient: 'from-rose-500 via-amber-500 to-violet-600',
    glow: 'bg-rose-400',
    badge: 'best',
  },
}

export function starsPackMeta(packId, index = 0) {
  if (STARS_PACK_META[packId]) return STARS_PACK_META[packId]
  const fallbacks = [
    { gradient: 'from-zinc-500 to-zinc-700', glow: 'bg-zinc-400', badge: null },
    { gradient: 'from-slate-600 to-slate-800', glow: 'bg-slate-400', badge: null },
    { gradient: 'from-brand-600 to-cyan-600', glow: 'bg-cyan-400', badge: 'popular' },
    { gradient: 'from-indigo-600 to-blue-700', glow: 'bg-indigo-400', badge: null },
    { gradient: 'from-amber-500 to-violet-700', glow: 'bg-amber-400', badge: 'best' },
    { gradient: 'from-rose-500 via-amber-500 to-violet-600', glow: 'bg-rose-400', badge: 'best' },
  ]
  return fallbacks[index % fallbacks.length]
}
