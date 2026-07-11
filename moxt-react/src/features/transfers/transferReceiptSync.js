import { buildTransferReceiptPayload } from './transferProofUtils'
import { upsertTransferReceipt } from '../finance/financeSlice'

export function syncTransferReceipt(store, transfer) {
  const payload = buildTransferReceiptPayload(transfer)
  if (!payload) return
  store.dispatch(upsertTransferReceipt(payload))
}
