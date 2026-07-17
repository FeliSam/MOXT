export const TRANSFER_PROOF_META = {
  payment: {
    kind: 'payment',
    labelKey: 'transfers.proof.payment.label',
    shortLabelKey: 'transfers.proof.payment.short',
  },
  business: {
    kind: 'business',
    labelKey: 'transfers.proof.business.label',
    shortLabelKey: 'transfers.proof.business.short',
  },
  received: {
    kind: 'received',
    labelKey: 'transfers.proof.received.label',
    shortLabelKey: 'transfers.proof.received.short',
  },
}

function proofExtension(proof) {
  const fromName = proof?.name?.split('.').pop()?.toLowerCase()
  if (fromName) return fromName
  if (proof?.type?.includes('pdf')) return 'pdf'
  if (proof?.type?.startsWith('image/')) return proof.type.split('/')[1] || 'jpg'
  return 'pdf'
}

export function inferProofStoragePath(transfer, kind, proof) {
  if (!transfer || !proof) return null
  if (proof.path) return proof.path

  const ext = proofExtension(proof)
  if (kind === 'payment') {
    return `${transfer.userId}/${transfer.id}/proof.${ext}`
  }
  if (kind === 'business') {
    const ownerId = transfer.businessOwnerId || transfer.userId
    return `${ownerId}/${transfer.id}/business.${ext}`
  }
  if (kind === 'received') {
    return `${transfer.userId}/${transfer.id}-receive/proof.${ext}`
  }
  return null
}

export function getTransferProofEntries(transfer) {
  if (!transfer) return []

  const entries = []
  if (transfer.paymentProof?.name) {
    entries.push({
      ...TRANSFER_PROOF_META.payment,
      proof: transfer.paymentProof,
      path: inferProofStoragePath(transfer, 'payment', transfer.paymentProof),
    })
  }
  if (transfer.businessProof?.name) {
    entries.push({
      ...TRANSFER_PROOF_META.business,
      proof: transfer.businessProof,
      path: inferProofStoragePath(transfer, 'business', transfer.businessProof),
    })
  }
  if (transfer.receivedProof?.name) {
    entries.push({
      ...TRANSFER_PROOF_META.received,
      proof: transfer.receivedProof,
      path: inferProofStoragePath(transfer, 'received', transfer.receivedProof),
    })
  }
  return entries
}

export function buildReceiptProofsFromTransfer(transfer) {
  return getTransferProofEntries(transfer).map((entry) => ({
    kind: entry.kind,
    labelKey: entry.labelKey,
    name: entry.proof.name,
    size: entry.proof.size,
    type: entry.proof.type,
    url: entry.proof.url || null,
    path: entry.path,
    uploadedAt: entry.proof.uploadedAt || null,
  }))
}

export function buildTransferReceiptPayload(transfer) {
  if (!transfer?.userId) return null

  return {
    userId: transfer.userId,
    relatedType: 'transfer',
    relatedId: transfer.id,
    titleKey: 'transfers.receipt.storedTitle',
    title: `Reçu transfert ${transfer.id}`,
    amount: transfer.totalToPay || transfer.amountSent || transfer.amount,
    currency: transfer.currencyFrom || transfer.currency || 'XOF',
    status: transfer.status,
    details: {
      direction: transfer.direction,
      exchanger: transfer.exchanger?.name,
      receivedAmount: transfer.receivedAmount,
      receivedCurrency: transfer.currencyTo,
      proofs: buildReceiptProofsFromTransfer(transfer),
    },
  }
}

export function getReceiptProofEntries(receipt, transfer) {
  const stored = receipt?.details?.proofs
  if (Array.isArray(stored) && stored.length) {
    return stored.map((item) => ({
      ...TRANSFER_PROOF_META[item.kind],
      kind: item.kind,
      labelKey: item.labelKey || TRANSFER_PROOF_META[item.kind]?.labelKey,
      proof: item,
      path: item.path || (transfer ? inferProofStoragePath(transfer, item.kind, item) : null),
    }))
  }
  return transfer ? getTransferProofEntries(transfer) : []
}
