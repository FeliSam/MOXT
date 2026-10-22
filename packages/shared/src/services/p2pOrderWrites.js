/**
 * Cycle d'une commande P2P, mêmes gardes que p2pSlice et le RPC moxt_sync_p2p_order.
 */

const PAYMENT_WINDOW_MS = 30 * 60 * 1000
const CONFIRM_WINDOW_MS = 60 * 60 * 1000

function createId(prefix) {
  const suffix =
    globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return `${prefix}-${suffix.toUpperCase()}`
}

export function p2pOrderToRemoteRow(order) {
  const timeline = Array.isArray(order.timeline) ? [...order.timeline] : []
  return {
    id: order.id,
    offer_id: order.offerId || order.offer_id,
    buyer_id: order.buyerId,
    buyer_name: order.buyerName || '',
    seller_id: order.sellerId,
    seller_name: order.sellerName || '',
    amount: Number(order.amount) || 0,
    from_currency: order.fromCurrency || 'RUB',
    to_currency: order.toCurrency || 'XOF',
    rate: Number(order.rate) || 0,
    fee: Number(order.fee) || 0,
    status: order.status || 'created',
    proofs: order.proofs || [],
    ratings: order.ratings || [],
    timeline,
    payment_due_at: order.paymentDueAt || null,
    confirm_due_at: order.confirmDueAt || null,
    created_at: order.createdAt || new Date().toISOString(),
  }
}

function offerRow(offer) {
  if (!offer) return null
  return {
    id: offer.id,
    owner_id: offer.ownerId,
    owner_name: offer.ownerName || '',
    amount: Number(offer.amount) || 0,
    from_currency: offer.fromCurrency || 'RUB',
    to_currency: offer.toCurrency || 'XOF',
    rate: Number(offer.rate) || 0,
    status: offer.status || 'active',
    payload: offer,
    created_at: offer.createdAt || new Date().toISOString(),
  }
}

/** @param {object | null} [offer] */
export async function syncP2pOrder(client, order, offer = null) {
  if (!client) throw new Error('Client Supabase indisponible')
  const remoteOrder = p2pOrderToRemoteRow(order)
  if (!remoteOrder.offer_id) throw new Error('Offre P2P introuvable pour cette commande.')
  const { error } = await client.rpc('moxt_sync_p2p_order', {
    p_order: remoteOrder,
    p_offer: offerRow(offer),
  })
  if (error) throw error
  return order
}

export function buildAcceptedOrder(buyer, offer, now = new Date()) {
  const iso = now.toISOString()
  return {
    id: createId('ORD'),
    offerId: offer.id,
    buyerId: buyer.id,
    buyerName: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim(),
    sellerId: offer.ownerId,
    sellerName: offer.ownerName || '',
    amount: offer.amount,
    fromCurrency: offer.fromCurrency,
    toCurrency: offer.toCurrency,
    rate: offer.rate,
    method: offer.method || '',
    comment: offer.comment || '',
    receivePhone: offer.receivePhone || '',
    receiveName: offer.receiveName || '',
    fee: 0,
    status: 'created',
    proofs: [],
    ratings: [],
    createdAt: iso,
    paymentDueAt: null,
    confirmDueAt: null,
    timeline: [{ status: 'created', at: iso, method: offer.method || '', comment: offer.comment || '' }],
  }
}

/** Même enchaînement que updateOrderStatus. */
export function advanceP2pOrder(order, status, note = null, now = new Date()) {
  if (!order) throw new Error('Commande introuvable')
  if (order.status === status) return order
  if (status === 'seller_accepted' && order.status !== 'created') throw new Error('Le vendeur ne peut accepter que une commande en attente.')
  if (status === 'waiting_payment' && order.status !== 'seller_accepted') throw new Error('Le paiement se déclare après acceptation.')
  if (status === 'completed') {
    const sellerProof = (order.proofs || []).some((proof) => proof.userId === order.sellerId)
    if (!sellerProof) throw new Error('Le vendeur doit joindre une preuve avant de terminer.')
  }
  const at = now.toISOString()
  const next = {
    ...order,
    status,
    updatedAt: at,
    timeline: [...(order.timeline || []), { status, at, note }],
  }
  if (status === 'seller_accepted') next.paymentDueAt = new Date(now.getTime() + PAYMENT_WINDOW_MS).toISOString()
  if (status === 'waiting_payment') next.confirmDueAt = new Date(now.getTime() + CONFIRM_WINDOW_MS).toISOString()
  return next
}

export function withP2pProof(order, proof) {
  return {
    ...order,
    proofs: [
      ...(order.proofs || []),
      {
        id: createId('P2PPROOF'),
        userId: proof.userId,
        name: proof.name,
        size: Number(proof.size) || 0,
        type: proof.type,
        path: proof.path || null,
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

export function withBuyerReceive(order, details) {
  const at = new Date().toISOString()
  return {
    ...order,
    buyerReceivePhone: details.phone || '',
    buyerReceiveName: details.name || '',
    buyerReceiveMethod: details.method || '',
    timeline: [
      ...(order.timeline || []),
      {
        status: 'buyer_receive_details',
        at,
        buyerReceivePhone: details.phone || '',
        buyerReceiveName: details.name || '',
        buyerReceiveMethod: details.method || '',
      },
    ],
  }
}
