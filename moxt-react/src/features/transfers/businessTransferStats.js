import { TRANSFER_STATUS } from './transferConfig'
import { directionInfo, getTransferPricing } from './transferUtils'

const PIPELINE_STATUSES = [
  TRANSFER_STATUS.PENDING,
  TRANSFER_STATUS.DECLARED,
  TRANSFER_STATUS.RECEIVED,
  TRANSFER_STATUS.PROCESSING,
  TRANSFER_STATUS.PAID_OUT,
]

const STATUS_ORDER = [
  TRANSFER_STATUS.PENDING,
  TRANSFER_STATUS.DECLARED,
  TRANSFER_STATUS.RECEIVED,
  TRANSFER_STATUS.PROCESSING,
  TRANSFER_STATUS.PAID_OUT,
  TRANSFER_STATUS.COMPLETED,
  TRANSFER_STATUS.CANCELLED,
  TRANSFER_STATUS.EXPIRED,
]

function toDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function timelineAt(transfer, status) {
  const event = (transfer.timeline || []).find((item) => item.status === status)
  return toDate(event?.at || event?.createdAt)
}

function avgHours(durationsMs) {
  if (!durationsMs.length) return null
  const sum = durationsMs.reduce((acc, ms) => acc + ms, 0)
  return Math.round((sum / durationsMs.length / 36e5) * 10) / 10
}

function addCurrencyAmount(map, currency, amount) {
  const code = currency || '—'
  const next = Number(amount) || 0
  map[code] = (map[code] || 0) + next
}

function monthBuckets(monthsBack = 6) {
  const now = new Date()
  return Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1)
    return {
      label: d.toLocaleString('fr-FR', { month: 'short' }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      created: 0,
      completed: 0,
    }
  })
}

/**
 * Statistiques opérationnelles pour une entreprise de transfert.
 * @param {Array} transfers — déjà filtrés sur businessId
 * @param {{ average?: number, count?: number }} [rating]
 */
export function computeBusinessTransferStats(transfers = [], rating = {}) {
  const list = Array.isArray(transfers) ? transfers : []
  const byStatus = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0]))
  const byDirection = {}
  const sentByCurrency = {}
  const feesByCurrency = {}
  const totalByCurrency = {}
  const receivedByCurrency = {}
  const createdByMonth = monthBuckets(6)

  let awaitingBusinessAction = 0
  const receiveToPayoutMs = []
  const declaredToReceivedMs = []
  const payoutToCompletedMs = []

  for (const transfer of list) {
    const status = transfer.status || TRANSFER_STATUS.PENDING
    if (byStatus[status] != null) byStatus[status] += 1
    else byStatus[status] = 1

    if (
      status === TRANSFER_STATUS.DECLARED ||
      status === TRANSFER_STATUS.RECEIVED
    ) {
      awaitingBusinessAction += 1
    }

    const direction = transfer.direction || 'unknown'
    byDirection[direction] = (byDirection[direction] || 0) + 1

    const pricing = getTransferPricing(transfer)
    const info = directionInfo(transfer.direction, transfer.originCountry)
    const currencyFrom = transfer.currencyFrom || info.from
    const currencyTo = transfer.currencyTo || info.to

    addCurrencyAmount(sentByCurrency, currencyFrom, pricing.amountSent)
    addCurrencyAmount(feesByCurrency, currencyFrom, pricing.fees)
    addCurrencyAmount(totalByCurrency, currencyFrom, pricing.totalToPay)
    addCurrencyAmount(receivedByCurrency, currencyTo, transfer.amountReceived)

    const createdAt = toDate(transfer.createdAt)
    if (createdAt) {
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
      const bucket = createdByMonth.find((m) => m.key === monthKey)
      if (bucket) bucket.created += 1
    }

    if (status === TRANSFER_STATUS.COMPLETED) {
      const completedAt =
        timelineAt(transfer, TRANSFER_STATUS.COMPLETED) || toDate(transfer.updatedAt)
      if (completedAt) {
        const monthKey = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, '0')}`
        const bucket = createdByMonth.find((m) => m.key === monthKey)
        if (bucket) bucket.completed += 1
      }
    }

    const declaredAt = timelineAt(transfer, TRANSFER_STATUS.DECLARED)
    const receivedAt = timelineAt(transfer, TRANSFER_STATUS.RECEIVED)
    const paidOutAt = timelineAt(transfer, TRANSFER_STATUS.PAID_OUT)
    const completedAt = timelineAt(transfer, TRANSFER_STATUS.COMPLETED)

    if (declaredAt && receivedAt && receivedAt >= declaredAt) {
      declaredToReceivedMs.push(receivedAt - declaredAt)
    }
    if (receivedAt && paidOutAt && paidOutAt >= receivedAt) {
      receiveToPayoutMs.push(paidOutAt - receivedAt)
    }
    if (paidOutAt && completedAt && completedAt >= paidOutAt) {
      payoutToCompletedMs.push(completedAt - paidOutAt)
    }
  }

  const completed = byStatus[TRANSFER_STATUS.COMPLETED] || 0
  const cancelledOrExpired =
    (byStatus[TRANSFER_STATUS.CANCELLED] || 0) + (byStatus[TRANSFER_STATUS.EXPIRED] || 0)
  const inPipeline = PIPELINE_STATUSES.reduce((sum, status) => sum + (byStatus[status] || 0), 0)

  const statusBreakdown = STATUS_ORDER.map((status) => ({
    status,
    count: byStatus[status] || 0,
  }))

  const directionBreakdown = Object.entries(byDirection)
    .map(([direction, count]) => ({ direction, count }))
    .sort((a, b) => b.count - a.count)

  const toCurrencyRows = (map) =>
    Object.entries(map)
      .map(([currency, amount]) => ({
        currency,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount)

  return {
    total: list.length,
    inPipeline,
    completed,
    cancelledOrExpired,
    awaitingBusinessAction,
    byStatus,
    statusBreakdown,
    directionBreakdown,
    volumes: {
      sent: toCurrencyRows(sentByCurrency),
      fees: toCurrencyRows(feesByCurrency),
      totalCollected: toCurrencyRows(totalByCurrency),
      received: toCurrencyRows(receivedByCurrency),
    },
    averages: {
      declaredToReceivedHours: avgHours(declaredToReceivedMs),
      receivedToPayoutHours: avgHours(receiveToPayoutMs),
      payoutToCompletedHours: avgHours(payoutToCompletedMs),
    },
    monthly: createdByMonth.map((bucket) => ({
      ...bucket,
      count: bucket.created,
    })),
    rating: {
      average: rating?.average ?? null,
      count: rating?.count ?? 0,
    },
  }
}

export function businessHasPublicationModules(services = []) {
  const set = new Set(services || [])
  return ['Marketplace', 'Jobs', 'Events', 'Colis', 'P2P'].some((key) => set.has(key))
}
