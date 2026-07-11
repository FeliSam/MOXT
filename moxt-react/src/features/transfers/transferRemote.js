import { fromRow } from '../../services/remoteRowMapper'
import { directionInfo, getTransferPricing } from './transferUtils'

function parseJsonField(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function buildTransferRemotePayload(transfer) {
  return {
    amountSent: transfer.amountSent,
    amountReceived: transfer.amountReceived,
    fees: transfer.fees,
    totalToPay: transfer.totalToPay,
    currencyFrom: transfer.currencyFrom,
    currencyTo: transfer.currencyTo,
    feePercent: transfer.feePercent,
    rateMarginPercent: transfer.rateMarginPercent,
    rawRate: transfer.rawRate,
    receivedAt: transfer.receivedAt,
    receivedMethod: transfer.receivedMethod,
    receivedProof: transfer.receivedProof,
  }
}

export function transferFromRemoteRow(row) {
  if (!row) return row

  const base = fromRow(row)
  const nested = parseJsonField(base.payload, {}) || {}

  const direction = base.direction || nested.direction || 'BJ_TO_RU'
  const originCountry = base.originCountry || nested.originCountry || 'BJ'
  const info = directionInfo(direction, originCountry)

  const amountSent = Number(
    base.amountSent ?? nested.amountSent ?? base.amount ?? nested.amount ?? 0,
  )
  const fees = Number(base.fees ?? nested.fees ?? base.fee ?? nested.fee ?? 0)
  const currencyFrom = base.currencyFrom ?? nested.currencyFrom ?? info.from
  const currencyTo = base.currencyTo ?? nested.currencyTo ?? info.to

  const pricing = getTransferPricing({
    ...base,
    ...nested,
    amountSent,
    amount: amountSent,
    fees,
    fee: fees,
    currencyFrom,
    feePercent: base.feePercent ?? nested.feePercent,
    totalToPay: base.totalToPay ?? nested.totalToPay,
  })

  return {
    ...base,
    ...nested,
    direction,
    originCountry,
    amountSent: pricing.amountSent,
    fees: pricing.fees,
    totalToPay: pricing.totalToPay,
    feePercent: pricing.feePercent,
    currencyFrom,
    currencyTo,
    amountReceived: Number(
      base.amountReceived ?? nested.amountReceived ?? base.receivedAmount ?? 0,
    ),
    receivedAt: base.receivedAt ?? nested.receivedAt ?? null,
    receivedMethod: base.receivedMethod ?? nested.receivedMethod ?? null,
    receivedProof: base.receivedProof ?? nested.receivedProof ?? null,
    paymentProof: parseJsonField(base.paymentProof, base.paymentProof),
    businessProof: parseJsonField(base.businessProof, base.businessProof),
    timeline: parseJsonField(base.timeline, []),
    sender: parseJsonField(base.sender, {}),
    recipient: parseJsonField(base.recipient, {}),
    exchanger: parseJsonField(base.exchanger, {}),
    payload: nested,
  }
}

export function transfersFromRemoteRows(rows = []) {
  return rows.map(transferFromRemoteRow)
}
