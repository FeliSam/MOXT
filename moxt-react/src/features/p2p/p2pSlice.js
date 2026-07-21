import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { calculateP2PFee } from './p2pUtils'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'

const offersStorage = createLocalStorage('moxt-p2p-offers-v1')
const ordersStorage = createLocalStorage('moxt-p2p-orders-v1')

const p2pSlice = createSlice({
  name: 'p2p',
  initialState: { offers: offersStorage.read(), orders: ordersStorage.read() },
  reducers: {
    setAll(state, action) {
      if (action.payload.offers) {
        state.offers = mergeRemoteById(state.offers, action.payload.offers)
      }
      if (action.payload.orders) {
        state.orders = mergeRemoteById(state.orders, action.payload.orders)
      }
    },
    createOffer: {
      reducer(state, action) {
        state.offers.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: createId('P2P'),
            amount: Number(values.amount),
            rate: Number(values.rate),
            status: 'active',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateOfferStatus(state, action) {
      const offer = state.offers.find((item) => item.id === action.payload.id)
      if (!offer) return
      offer.status = action.payload.status
      offer.updatedAt = new Date().toISOString()
    },
    acceptOffer: {
      reducer(state, action) {
        const offer = state.offers.find((item) => item.id === action.payload.offerId)
        if (!offer || offer.status !== 'active') return
        offer.status = 'accepted'
        state.orders.unshift(action.payload)
      },
      prepare({ buyer, offer }) {
        const now = new Date().toISOString()
        return {
          payload: {
            id: createId('ORD'),
            offerId: offer.id,
            buyerId: buyer.id,
            buyerName: `${buyer.firstName} ${buyer.lastName}`,
            sellerId: offer.ownerId,
            sellerName: offer.ownerName,
            amount: offer.amount,
            fromCurrency: offer.fromCurrency,
            toCurrency: offer.toCurrency,
            rate: offer.rate,
            fee: calculateP2PFee(offer.amount, offer.fromCurrency),
            status: 'created',
            proofs: [],
            ratings: [],
            createdAt: now,
            timeline: [{ status: 'created', at: now }],
          },
        }
      },
    },
    updateOrderStatus(state, action) {
      const order = state.orders.find((item) => item.id === action.payload.id)
      if (!order) return
      order.status = action.payload.status
      order.timeline.push({ status: action.payload.status, at: new Date().toISOString() })
    },
    moderateOffer(state, action) {
      const offer = state.offers.find((item) => item.id === action.payload.id)
      if (!offer) return
      const next = action.payload.status
      if (!['active', 'archived'].includes(next)) return
      offer.status = next
      offer.updatedAt = new Date().toISOString()
    },
    moderateOrder(state, action) {
      const order = state.orders.find((item) => item.id === action.payload.id)
      if (!order) return
      const isStaff = ['admin', 'superadmin', 'moderator'].includes(action.payload.actorRole)
      if (!isStaff) return
      const next = action.payload.status
      if (!['completed', 'cancelled', 'waiting_payment'].includes(next)) return
      if (order.status === next) return
      order.status = next
      order.timeline ||= []
      order.timeline.push({
        status: next,
        at: new Date().toISOString(),
        actorType: 'admin',
        actorId: action.payload.actorId || null,
        note: action.payload.note || 'admin_moderate',
      })
    },
    addOrderProof(state, action) {
      const order = state.orders.find((item) => item.id === action.payload.id)
      if (!order) return
      order.proofs ||= []
      order.proofs.push({
        id: createId('P2PPROOF'),
        userId: action.payload.userId,
        name: action.payload.name,
        size: Number(action.payload.size) || 0,
        type: action.payload.type,
        path: action.payload.path || null,
        createdAt: new Date().toISOString(),
      })
    },
    rateOrder(state, action) {
      const order = state.orders.find((item) => item.id === action.payload.id)
      if (!order || order.status !== 'completed') return
      order.ratings ||= []
      const existing = order.ratings.find((item) => item.userId === action.payload.userId)
      const rating = {
        userId: action.payload.userId,
        rating: Math.min(5, Math.max(1, Number(action.payload.rating))),
        comment: action.payload.comment?.trim() || '',
        createdAt: new Date().toISOString(),
      }
      if (existing) Object.assign(existing, rating)
      else order.ratings.push(rating)
    },
  },
})

export const {
  acceptOffer,
  addOrderProof,
  createOffer,
  moderateOffer,
  moderateOrder,
  rateOrder,
  setAll,
  updateOfferStatus,
  updateOrderStatus,
} = p2pSlice.actions
export default p2pSlice.reducer
