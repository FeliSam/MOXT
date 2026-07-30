import { TRANSFER_STATUS } from '../transferConfig'
import { getTransferPricing } from '../transferUtils'

export function build30DayActivity(transfers = []) {
  const now = new Date()
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (29 - i))
    const date = d.toISOString().slice(0, 10)
    return {
      date,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      count: 0,
      volume: 0,
      transfers: [],
    }
  })

  for (const transfer of transfers) {
    if (!transfer.createdAt) continue
    const dateStr = new Date(transfer.createdAt).toISOString().slice(0, 10)
    const bucket = days.find((d) => d.date === dateStr)
    if (!bucket) continue
    bucket.count += 1
    bucket.volume += Number(getTransferPricing(transfer).totalToPay) || 0
    bucket.transfers.push(transfer)
  }

  return days
}

export function formatHoursLabel(hours, fallback = '—') {
  if (hours == null || Number.isNaN(hours)) return fallback
  return `${hours} h`
}

export const PIPELINE_COLUMNS = [
  { key: TRANSFER_STATUS.PENDING },
  { key: TRANSFER_STATUS.DECLARED },
  { key: TRANSFER_STATUS.RECEIVED },
  { key: TRANSFER_STATUS.PROCESSING },
  { key: TRANSFER_STATUS.PAID_OUT },
  { key: TRANSFER_STATUS.COMPLETED },
]

export const ACTIONABLE_STATUSES = [TRANSFER_STATUS.DECLARED, TRANSFER_STATUS.RECEIVED]
