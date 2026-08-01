import { TRANSFER_STATUS } from '../transferConfig'
import { directionInfo, getTransferPricing } from '../transferUtils'

function completedMonthKey(transfer) {
  const event = (transfer.timeline || []).find(
    (item) => item.status === TRANSFER_STATUS.COMPLETED,
  )
  const raw = event?.at || event?.createdAt || transfer.updatedAt
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Volume du mois en cours, séparé RUB / devise locale de l’échangeur.
 * Chaque transfert complété contribue côté envoi (currencyFrom) et côté réception (currencyTo).
 */
export function computeMonthlyVolumeByCurrency(transfers = [], localCurrency = 'XOF') {
  const monthKey = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()
  const local = String(localCurrency || 'XOF').toUpperCase()
  let rub = 0
  let localTotal = 0
  const other = {}

  const add = (code, amount) => {
    const value = Number(amount) || 0
    if (!value) return
    const currency = String(code || '').toUpperCase() || '—'
    if (currency === 'RUB') rub += value
    else if (currency === local) localTotal += value
    else other[currency] = (other[currency] || 0) + value
  }

  for (const transfer of transfers) {
    if (transfer?.status !== TRANSFER_STATUS.COMPLETED) continue
    if (completedMonthKey(transfer) !== monthKey) continue

    const info = directionInfo(transfer.direction, transfer.originCountry)
    const pricing = getTransferPricing(transfer)
    const currencyFrom = transfer.currencyFrom || info.from
    const currencyTo = transfer.currencyTo || info.to

    add(currencyFrom, pricing.totalToPay ?? pricing.amountSent)
    add(currencyTo, transfer.amountReceived ?? pricing.amountReceived)
  }

  return {
    monthKey,
    localCurrency: local,
    rub: Math.round(rub * 100) / 100,
    local: Math.round(localTotal * 100) / 100,
    other: Object.entries(other)
      .map(([currency, amount]) => ({
        currency,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount),
  }
}

function toLocalDateKey(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Activité des 30 derniers jours (créés + complétés + volume).
 * Clés de date en heure locale pour éviter les décalages UTC.
 */
export function build30DayActivity(transfers = []) {
  const now = new Date()
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i))
    const date = toLocalDateKey(d)
    return {
      date,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      count: 0,
      completed: 0,
      volume: 0,
      transfers: [],
    }
  })
  const byDate = new Map(days.map((day) => [day.date, day]))

  for (const transfer of transfers) {
    if (!transfer?.createdAt) continue
    const dateStr = toLocalDateKey(transfer.createdAt)
    const bucket = dateStr ? byDate.get(dateStr) : null
    if (!bucket) continue
    bucket.count += 1
    bucket.volume += Number(getTransferPricing(transfer).totalToPay) || 0
    if (transfer.status === TRANSFER_STATUS.COMPLETED) bucket.completed += 1
    bucket.transfers.push(transfer)
  }

  return days
}

/** Tendance mois courant vs précédent (créés / terminés). */
export function computeMonthlyTrend(monthly = []) {
  if (!Array.isArray(monthly) || monthly.length < 2) return null
  const last = monthly[monthly.length - 1]
  const prev = monthly[monthly.length - 2]
  const deltaPct = (current, previous) => {
    if (!previous) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }
  return {
    currentLabel: last.label,
    previousLabel: prev.label,
    created: {
      current: last.created || 0,
      previous: prev.created || 0,
      delta: (last.created || 0) - (prev.created || 0),
      pct: deltaPct(last.created || 0, prev.created || 0),
    },
    completed: {
      current: last.completed || 0,
      previous: prev.completed || 0,
      delta: (last.completed || 0) - (prev.completed || 0),
      pct: deltaPct(last.completed || 0, prev.completed || 0),
    },
    volumeCreated: {
      current: last.volumeCreated || 0,
      previous: prev.volumeCreated || 0,
      delta: (last.volumeCreated || 0) - (prev.volumeCreated || 0),
      pct: deltaPct(last.volumeCreated || 0, prev.volumeCreated || 0),
    },
    volumeCompleted: {
      current: last.volumeCompleted || 0,
      previous: prev.volumeCompleted || 0,
      delta: (last.volumeCompleted || 0) - (prev.volumeCompleted || 0),
      pct: deltaPct(last.volumeCompleted || 0, prev.volumeCompleted || 0),
    },
  }
}

export function formatHoursLabel(hours, fallback = '—') {
  if (hours == null || Number.isNaN(hours)) return fallback
  return `${hours} h`
}

export function formatTrendDelta(delta, pct) {
  const sign = delta > 0 ? '+' : ''
  const pctPart = pct == null ? '' : ` (${sign}${pct} %)`
  return `${sign}${delta}${pctPart}`
}

/** File à traiter : déclarés puis reçus, plus anciens d’abord. */
export function sortActionableTransfers(transfers = []) {
  const rank = {
    [TRANSFER_STATUS.PENDING_ACCEPTANCE]: 0,
    [TRANSFER_STATUS.DECLARED]: 1,
    [TRANSFER_STATUS.RECEIVED]: 2,
  }
  return [...transfers].sort((a, b) => {
    const ra = rank[a.status] ?? 9
    const rb = rank[b.status] ?? 9
    if (ra !== rb) return ra - rb
    const ta = new Date(a.createdAt || 0).getTime()
    const tb = new Date(b.createdAt || 0).getTime()
    return ta - tb
  })
}

export const PIPELINE_COLUMNS = [
  { key: TRANSFER_STATUS.PENDING_ACCEPTANCE },
  { key: TRANSFER_STATUS.PENDING },
  { key: TRANSFER_STATUS.DECLARED },
  { key: TRANSFER_STATUS.RECEIVED },
  { key: TRANSFER_STATUS.PROCESSING },
  { key: TRANSFER_STATUS.PAID_OUT },
  { key: TRANSFER_STATUS.COMPLETED },
]

export const ACTIONABLE_STATUSES = [
  TRANSFER_STATUS.PENDING_ACCEPTANCE,
  TRANSFER_STATUS.DECLARED,
  TRANSFER_STATUS.RECEIVED,
]

/** Limites UI prod pour éviter les listes monstrueuses. */
export const QUEUE_ACTIONABLE_LIMIT = 25
export const PIPELINE_PER_COLUMN_LIMIT = 8
