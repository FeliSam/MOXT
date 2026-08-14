import { createSlice } from '@reduxjs/toolkit'
import { matchUserId } from '../businesses/businessVisibility'
import {
  canActorPerformBusinessTransferAction,
  canActorPerformClientTransferAction,
} from './transferActionUtils'
import {
  buildAcceptanceWindow,
  buildPaymentDeadline,
  sanitizeTransferPaymentVisibility,
  stripPaymentDetailsFromExchanger,
} from './transferAcceptanceUtils'
import { mergeTransferRecord } from './transferRecordUtils'
import { DIRECTIONS, TRANSFER_STATUS, TRANSFER_TIMELINE_EVENT, TRANSFER_TRANSITIONS } from './transferConfig'
import { transferStorage } from './transferStorage'
import { calculateTransfer } from './transferUtils'

const initialState = {
  items: transferStorage.read().map(sanitizeTransferPaymentVisibility),
}

function pushTimeline(transfer, entry) {
  transfer.timeline ||= []
  transfer.timeline.push(entry)
}

function applyExchangerAssignment(transfer, exchanger, { nowIso, preserveAmounts = true }) {
  const previousBusinessId = transfer.businessId
  transfer.previousBusinessId = previousBusinessId || null
  transfer.reassignmentHistory = [
    ...(transfer.reassignmentHistory || []),
    {
      businessId: previousBusinessId,
      businessOwnerId: transfer.businessOwnerId,
      exchangerName: transfer.exchanger?.name || null,
      at: nowIso,
    },
  ].slice(-20)

  transfer.businessId = exchanger.id
  transfer.businessOwnerId = exchanger.ownerId || null

  const acceptanceRequired = exchanger.transferAcceptanceRequired === true
  const exchangerSnapshot = {
    id: exchanger.id,
    name: exchanger.name,
    rating: exchanger.rating,
    averageDelay: exchanger.averageDelay,
    paymentAccount: acceptanceRequired ? null : exchanger.paymentAccount || null,
    paymentDetails: acceptanceRequired ? null : exchanger.paymentDetails || null,
  }

  if (!acceptanceRequired) {
    exchangerSnapshot.paymentAccount = exchanger.paymentAccount || null
    exchangerSnapshot.paymentDetails = exchanger.paymentDetails || null
  }

  transfer.exchanger = exchangerSnapshot
  transfer.acceptanceRequired = acceptanceRequired

  if (acceptanceRequired) {
    Object.assign(transfer, buildAcceptanceWindow(new Date(nowIso).getTime()))
    transfer.status = TRANSFER_STATUS.PENDING_ACCEPTANCE
    transfer.paymentDeadlineAt = null
  } else {
    transfer.acceptanceRequired = false
    transfer.acceptanceRequestedAt = null
    transfer.acceptanceExpiresAt = null
    transfer.acceptanceResolvedAt = nowIso
    transfer.status = TRANSFER_STATUS.PENDING
    transfer.paymentDeadlineAt = buildPaymentDeadline(new Date(nowIso).getTime())
    if (!preserveAmounts) {
      // no-op: amounts stay from original transfer
    }
  }

  // Mettre à jour le snapshot frais si le nouvel échangeur a un % différent.
  if (exchanger.feePercent != null && Number.isFinite(Number(exchanger.feePercent))) {
    transfer.feePercent = Number(exchanger.feePercent)
  }
}

const transferSlice = createSlice({
  name: 'transfers',
  initialState,
  reducers: {
    setAll(state, action) {
      const payload = action.payload || {}
      if (Array.isArray(payload.items)) {
        Object.assign(state, {
          ...payload,
          items: payload.items.map(sanitizeTransferPaymentVisibility),
        })
        return
      }
      Object.assign(state, payload)
    },
    createTransfer: {
      reducer(state, action) {
        if (action.payload.blocked) return
        state.items.unshift(sanitizeTransferPaymentVisibility(action.payload))
      },
      prepare({
        amount,
        direction,
        exchanger,
        noteToExchanger,
        originCountry,
        rateDate,
        rateOverride,
        rateSource,
        recipient,
        sender,
        user,
      }) {
        if (!exchanger || !exchanger.ownerId || matchUserId(exchanger.ownerId, user.id)) {
          return {
            payload: {
              blocked: true,
              reason: !exchanger?.ownerId ? 'missing_business_owner' : 'self_business_transfer',
            },
          }
        }
        const calculation = calculateTransfer(
          amount,
          direction,
          exchanger.feePercent,
          rateOverride,
          originCountry,
          direction === DIRECTIONS.BJ_TO_RU
            ? exchanger.rateReductionToRu
            : exchanger.rateReductionFromRu,
        )
        const createdAt = new Date().toISOString()
        const acceptanceRequired = exchanger.transferAcceptanceRequired === true
        const acceptanceMeta = acceptanceRequired
          ? buildAcceptanceWindow(new Date(createdAt).getTime())
          : {
              acceptanceRequired: false,
              acceptanceRequestedAt: null,
              acceptanceExpiresAt: null,
              acceptanceResolvedAt: null,
            }
        const status = acceptanceRequired
          ? TRANSFER_STATUS.PENDING_ACCEPTANCE
          : TRANSFER_STATUS.PENDING
        const exchangerSnapshot = {
          id: exchanger.id,
          name: exchanger.name,
          rating: exchanger.rating,
          averageDelay: exchanger.averageDelay,
          paymentAccount: acceptanceRequired ? null : exchanger.paymentAccount,
          paymentDetails: acceptanceRequired ? null : exchanger.paymentDetails || null,
        }
        // Conservés hors snapshot client pour restauration après acceptation.
        const pendingPaymentAccount = exchanger.paymentAccount || null
        const pendingPaymentDetails = exchanger.paymentDetails || null

        return {
          payload: {
            id: `MXT-${Date.now().toString(36).toUpperCase()}`,
            userId: user.id,
            originCountry: originCountry || user.originCountry || user.country || 'BJ',
            businessId: exchanger.id,
            businessOwnerId: exchanger.ownerId || null,
            status,
            direction,
            ...calculation,
            rateDate: rateDate || null,
            rateSource: rateSource || calculation.rateSource,
            sender,
            recipient,
            noteToExchanger: String(noteToExchanger || '')
              .trim()
              .slice(0, 300) || null,
            exchanger: exchangerSnapshot,
            pendingPaymentAccount: acceptanceRequired ? pendingPaymentAccount : null,
            pendingPaymentDetails: acceptanceRequired ? pendingPaymentDetails : null,
            paymentProof: null,
            createdAt,
            updatedAt: createdAt,
            paymentDeadlineAt: acceptanceRequired
              ? null
              : buildPaymentDeadline(new Date(createdAt).getTime()),
            reassignmentHistory: [],
            previousBusinessId: null,
            ...acceptanceMeta,
            timeline: [{ status, at: createdAt }],
          },
        }
      },
    },
    acceptTransferRequest(state, action) {
      const transfer = state.items.find((item) => item.id === action.payload.id)
      if (!transfer || transfer.status !== TRANSFER_STATUS.PENDING_ACCEPTANCE) return
      if (
        !canActorPerformBusinessTransferAction(
          transfer,
          action.payload.actorId,
          action.payload.actorRole,
        )
      ) {
        return
      }
      const now = Date.now()
      if (
        transfer.acceptanceExpiresAt &&
        new Date(transfer.acceptanceExpiresAt).getTime() <= now
      ) {
        return
      }
      const nowIso = new Date(now).toISOString()
      transfer.status = TRANSFER_STATUS.PENDING
      transfer.acceptanceResolvedAt = nowIso
      transfer.paymentDeadlineAt = buildPaymentDeadline(now)
      if (transfer.pendingPaymentDetails || transfer.pendingPaymentAccount) {
        transfer.exchanger = {
          ...transfer.exchanger,
          paymentAccount: transfer.pendingPaymentAccount || transfer.exchanger?.paymentAccount,
          paymentDetails: transfer.pendingPaymentDetails || transfer.exchanger?.paymentDetails,
        }
        transfer.pendingPaymentAccount = null
        transfer.pendingPaymentDetails = null
      }
      transfer.updatedAt = nowIso
      pushTimeline(transfer, {
        status: TRANSFER_TIMELINE_EVENT.BUSINESS_ACCEPTED,
        at: nowIso,
        actorType: 'business',
        actorId: action.payload.actorId,
      })
    },
    declineTransferRequest(state, action) {
      const transfer = state.items.find((item) => item.id === action.payload.id)
      if (!transfer || transfer.status !== TRANSFER_STATUS.PENDING_ACCEPTANCE) return
      if (
        !canActorPerformBusinessTransferAction(
          transfer,
          action.payload.actorId,
          action.payload.actorRole,
        )
      ) {
        return
      }
      const nowIso = new Date().toISOString()
      transfer.status = TRANSFER_STATUS.DECLINED
      transfer.acceptanceResolvedAt = nowIso
      transfer.updatedAt = nowIso
      pushTimeline(transfer, {
        status: TRANSFER_STATUS.DECLINED,
        at: nowIso,
        actorType: 'business',
        actorId: action.payload.actorId,
        note: action.payload.note || 'business_declined',
      })
    },
    reassignTransferExchanger(state, action) {
      const transfer = state.items.find((item) => item.id === action.payload.id)
      if (!transfer) return
      if (
        ![TRANSFER_STATUS.DECLINED, TRANSFER_STATUS.PENDING_ACCEPTANCE].includes(transfer.status)
      ) {
        return
      }
      // Réassignation client uniquement après refus/timeout (DECLINED),
      // sauf timeout local déjà passé en PENDING_ACCEPTANCE expiré.
      if (transfer.status === TRANSFER_STATUS.PENDING_ACCEPTANCE) {
        const expired =
          transfer.acceptanceExpiresAt &&
          new Date(transfer.acceptanceExpiresAt).getTime() <= Date.now()
        if (!expired) return
      }
      if (!canActorPerformClientTransferAction(transfer, action.payload.actorId)) return

      const exchanger = action.payload.exchanger
      if (!exchanger?.id || !exchanger.ownerId) return
      if (matchUserId(exchanger.ownerId, transfer.userId)) return
      if (exchanger.id === transfer.businessId) return

      const nowIso = new Date().toISOString()
      applyExchangerAssignment(transfer, exchanger, { nowIso })

      if (action.payload.amount != null && exchanger.feePercent != null) {
        const calculation = calculateTransfer(
          action.payload.amount,
          transfer.direction,
          exchanger.feePercent,
          action.payload.rateOverride,
          transfer.originCountry,
          transfer.direction === DIRECTIONS.BJ_TO_RU
            ? exchanger.rateReductionToRu
            : exchanger.rateReductionFromRu,
        )
        Object.assign(transfer, calculation)
        if (action.payload.rateSource) transfer.rateSource = action.payload.rateSource
        if (action.payload.rateDate) transfer.rateDate = action.payload.rateDate
      }

      if (exchanger.transferAcceptanceRequired) {
        transfer.pendingPaymentAccount = exchanger.paymentAccount || null
        transfer.pendingPaymentDetails = exchanger.paymentDetails || null
        transfer.exchanger = stripPaymentDetailsFromExchanger(transfer.exchanger)
      } else {
        transfer.pendingPaymentAccount = null
        transfer.pendingPaymentDetails = null
      }

      transfer.updatedAt = nowIso
      pushTimeline(transfer, {
        status: transfer.status,
        at: nowIso,
        actorType: 'client',
        actorId: action.payload.actorId,
        note: 'reassigned_exchanger',
        previousBusinessId: transfer.previousBusinessId,
        businessId: transfer.businessId,
      })
    },
    declarePayment(state, action) {
      const payload =
        typeof action.payload === 'string' ? { id: action.payload, proof: null } : action.payload
      const transfer = state.items.find((item) => item.id === payload.id)
      if (!transfer || transfer.status !== TRANSFER_STATUS.PENDING) return
      if (transfer.acceptanceRequired === true && !transfer.acceptanceResolvedAt) return
      if (!canActorPerformClientTransferAction(transfer, payload.actorId)) return
      transfer.status = TRANSFER_STATUS.DECLARED
      transfer.paymentProof = payload.proof || null
      transfer.updatedAt = new Date().toISOString()
      transfer.timeline.push({
        status: TRANSFER_STATUS.DECLARED,
        at: transfer.updatedAt,
        actorType: 'client',
        actorId: payload.actorId,
        proofName: payload.proof?.name,
      })
    },
    cancelTransfer(state, action) {
      const payload =
        typeof action.payload === 'string' ? { id: action.payload } : action.payload
      const transfer = state.items.find((item) => item.id === payload.id)
      if (
        !transfer ||
        ![
          TRANSFER_STATUS.PENDING,
          TRANSFER_STATUS.DECLARED,
          TRANSFER_STATUS.PENDING_ACCEPTANCE,
          TRANSFER_STATUS.DECLINED,
        ].includes(transfer.status)
      )
        return
      if (!canActorPerformClientTransferAction(transfer, payload.actorId)) return
      transfer.status = TRANSFER_STATUS.CANCELLED
      transfer.updatedAt = new Date().toISOString()
      transfer.timeline.push({
        status: TRANSFER_STATUS.CANCELLED,
        at: transfer.updatedAt,
        actorType: 'client',
        actorId: payload.actorId,
      })
    },
    moderateTransfer(state, action) {
      const transfer = state.items.find((item) => item.id === action.payload.id)
      if (!transfer) return
      if (
        !canActorPerformBusinessTransferAction(
          transfer,
          action.payload.actorId,
          action.payload.actorRole,
        )
      ) {
        return
      }

      const isStaff = ['admin', 'superadmin', 'moderator'].includes(action.payload.actorRole)
      if (
        action.payload.status === TRANSFER_STATUS.CANCELLED &&
        isStaff &&
        transfer.status !== TRANSFER_STATUS.CANCELLED
      ) {
        transfer.status = TRANSFER_STATUS.CANCELLED
        transfer.updatedAt = new Date().toISOString()
        transfer.timeline ||= []
        transfer.timeline.push({
          status: TRANSFER_STATUS.CANCELLED,
          at: transfer.updatedAt,
          actorType: 'admin',
          actorId: action.payload.actorId,
          note: action.payload.note || 'admin_force_cancel',
        })
        return
      }

      const expectedStatus = TRANSFER_TRANSITIONS[transfer.status]
      if (!expectedStatus || action.payload.status !== expectedStatus) return
      if (expectedStatus === TRANSFER_STATUS.PAID_OUT && !action.payload.proof) return
      // Completing after payout is a client action (receiveTransfer); only staff may force it.
      if (expectedStatus === TRANSFER_STATUS.COMPLETED && !isStaff) {
        return
      }
      transfer.status = expectedStatus
      if (action.payload.proof) transfer.businessProof = action.payload.proof
      transfer.updatedAt = new Date().toISOString()
      transfer.timeline ||= []
      transfer.timeline.push({
        status: expectedStatus,
        at: transfer.updatedAt,
        actorType: isStaff ? 'admin' : 'business',
        actorId: action.payload.actorId || transfer.businessOwnerId,
        note: action.payload.note || '',
        proofName: action.payload.proof?.name,
      })
    },
    receiveTransfer(state, action) {
      const transfer = state.items.find((item) => item.id === action.payload.id)
      if (!transfer) return
      if (!canActorPerformClientTransferAction(transfer, action.payload.actorId)) return
      if (!transfer.businessProof || transfer.status !== TRANSFER_STATUS.PAID_OUT) return
      transfer.receivedAmount = action.payload.receivedAmount
      transfer.receivedMethod = action.payload.receivedMethod
      transfer.receivedProof = action.payload.receivedProof || null
      transfer.receivedAt = action.payload.receivedAt
      transfer.updatedAt = action.payload.receivedAt
      transfer.status = TRANSFER_STATUS.COMPLETED
      transfer.timeline ||= []
      transfer.timeline.push({
        status: 'received',
        at: action.payload.receivedAt,
        actorType: 'client',
        actorId: action.payload.actorId,
        amount: action.payload.receivedAmount,
        method: action.payload.receivedMethod,
      })
      transfer.timeline.push({
        status: TRANSFER_STATUS.COMPLETED,
        at: action.payload.receivedAt,
        actorType: 'client',
        actorId: action.payload.actorId,
      })
    },
    expireOverdueTransfers(state, action) {
      const now = new Date(action.payload || Date.now()).getTime()
      state.items.forEach((transfer) => {
        if (
          transfer.status === TRANSFER_STATUS.PENDING_ACCEPTANCE &&
          transfer.acceptanceExpiresAt &&
          new Date(transfer.acceptanceExpiresAt).getTime() <= now
        ) {
          transfer.status = TRANSFER_STATUS.DECLINED
          transfer.acceptanceResolvedAt = new Date(now).toISOString()
          transfer.updatedAt = transfer.acceptanceResolvedAt
          pushTimeline(transfer, {
            status: TRANSFER_STATUS.DECLINED,
            at: transfer.updatedAt,
            note: 'acceptance_timeout',
          })
          return
        }
        if (
          transfer.status === TRANSFER_STATUS.PENDING &&
          transfer.paymentDeadlineAt &&
          new Date(transfer.paymentDeadlineAt).getTime() <= now
        ) {
          transfer.status = TRANSFER_STATUS.EXPIRED
          transfer.updatedAt = new Date(now).toISOString()
          transfer.timeline.push({ status: TRANSFER_STATUS.EXPIRED, at: transfer.updatedAt })
        }
      })
    },
    receiveRemoteTransfer(state, action) {
      const transfer = sanitizeTransferPaymentVisibility(action.payload)
      if (!transfer?.id || transfer.blocked) return
      const index = state.items.findIndex((item) => item.id === transfer.id)
      if (index === -1) state.items.unshift(transfer)
      else {
        state.items[index] = sanitizeTransferPaymentVisibility(
          mergeTransferRecord(state.items[index], transfer),
        )
      }
    },
    receiveRemoteTransfers(state, action) {
      const list = Array.isArray(action.payload) ? action.payload : []
      if (!list.length) return
      const byId = new Map(state.items.map((item) => [item.id, item]))
      for (const transfer of list) {
        if (!transfer?.id || transfer.blocked) continue
        const prev = byId.get(transfer.id)
        byId.set(
          transfer.id,
          sanitizeTransferPaymentVisibility(
            prev ? mergeTransferRecord(prev, transfer) : transfer,
          ),
        )
      }
      const next = [...byId.values()]
      next.sort((a, b) =>
        String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')),
      )
      state.items = next
    },
  },
})

export const {
  acceptTransferRequest,
  cancelTransfer,
  createTransfer,
  declarePayment,
  declineTransferRequest,
  expireOverdueTransfers,
  moderateTransfer,
  reassignTransferExchanger,
  receiveRemoteTransfer,
  receiveRemoteTransfers,
  receiveTransfer,
  setAll,
} = transferSlice.actions
export default transferSlice.reducer
