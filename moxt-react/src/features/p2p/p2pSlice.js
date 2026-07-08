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

export const { acceptOffer, addOrderProof, createOffer, rateOrder, updateOrderStatus, setAll } =
  p2pSlice.actions
export default p2pSlice.reducer
