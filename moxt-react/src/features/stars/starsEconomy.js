import { DEFAULT_QUOTA_CONFIG, monthlyBonusPoolForPlan } from './starsConfig'
import { resolveStarsActionCost } from './starsPricing'

export function quoteStarsSpend({
  bonusAvailable = 0,
  linkedBonusAvailable = 0,
  paidAvailable = 0,
  category,
  formulaKey = 'standard',
  durationKey = null,
  ownerType = 'user',
  config = DEFAULT_QUOTA_CONFIG,
} = {}) {
  const totalCost = resolveStarsActionCost({ category, formulaKey, durationKey, config })
  const primary = Math.min(Number(bonusAvailable) || 0, totalCost)
  const secondary = Math.min(Number(linkedBonusAvailable) || 0, totalCost - primary)
  const bonus = primary + secondary
  const paid = totalCost - bonus
  const insufficient = paid > (Number(paidAvailable) || 0)
  return {
    category,
    formulaKey,
    durationKey,
    cost: totalCost,
    totalCost,
    bonus,
    bonusPrimary: primary,
    bonusSecondary: secondary,
    paid,
    insufficient,
    remainingBonus: Number(bonusAvailable) || 0,
    remainingPaid: Number(paidAvailable) || 0,
    splitLabel: `${bonus} Bonus Stars + ${paid} Paid Stars`,
    bonusPoolQuota: monthlyBonusPoolForPlan(ownerType, config),
    quotas: { pool: monthlyBonusPoolForPlan(ownerType, config) },
  }
}

export function applyConsume(state, quote) {
  if (!quote || quote.insufficient) {
    return { ...state, ok: false }
  }
  const total = Number(quote.totalCost ?? quote.cost ?? 0)
  return {
    bonus: Math.max(0, (Number(state.bonus) || 0) - Number(quote.bonus || 0)),
    paid: Math.max(0, (Number(state.paid) || 0) - Number(quote.paid || 0)),
    ok: true,
    spent: total,
  }
}

export function twoConsumesOneSucceeds(initial, quote) {
  const first = applyConsume(initial, quote)
  const second = applyConsume(
    { bonus: first.bonus, paid: first.paid },
    quoteStarsSpend({
      ...quote,
      bonusAvailable: first.bonus,
      paidAvailable: first.paid,
      category: quote.category,
      formulaKey: quote.formulaKey,
      durationKey: quote.durationKey,
    }),
  )
  return { first, second }
}
