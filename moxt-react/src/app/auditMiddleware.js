import { recordAudit } from '../features/audit/auditSlice'
import { writeAuditEvent } from '../services/auditService'

const auditedPrefixes = [
  'auth/',
  'transfers/',
  'businesses/',
  'parcels/',
  'p2p/',
  'marketplace/',
  'jobs/',
  'events/',
  'videos/',
  'communications/',
  'administration/',
  'account/',
  'disputes/',
]

// Actions internes déclenchées en cascade par d'autres middlewares — ne pas auditer
// pour éviter l'inflation du log (ex: sendMessage → addNotification → +1 entrée parasite)
const excludedActions = new Set([
  'communications/addNotification',
  'communications/receiveRemoteNotification',
  'communications/receiveRemoteMessage',
  'communications/receiveRemoteConversation',
  'communications/setConversationMessages',
  'transfers/receiveRemoteTransfer',
  'audit/recordAudit',
])

/**
 * Mapping : type d'action Redux → action métier pour moxt_audit_log.
 * Seules les mutations importantes sont persistées en base.
 */
function resolveBusinessAction(actionType, payload) {
  switch (actionType) {
    case 'transfers/moderateTransfer': {
      const status = payload?.status
      if (!status) return null
      const action =
        status === 'cancelled' ? 'transfer.cancelled' : `transfer.advanced_to_${status}`
      return { action, targetId: payload?.id, targetType: 'transfer' }
    }
    case 'administration/updateUserStatus': {
      const status = payload?.status
      let actionName = 'user.reactivated'
      if (status === 'suspended') actionName = 'user.suspended'
      else if (status === 'pending_deletion') actionName = 'user.pending_deletion'
      return { action: actionName, targetId: payload?.id, targetType: 'user' }
    }
    case 'administration/purgeUserAccount':
      return { action: 'user.deleted', targetId: payload?.id, targetType: 'user' }
    case 'administration/updateUserRole':
      return {
        action: 'user.role_changed',
        targetId: payload?.id,
        targetType: 'user',
        extra: { role: payload?.role },
      }
    case 'account/updateVerificationStatus': {
      const action =
        payload?.status === 'verified' ? 'kyc.approved' : 'kyc.rejected'
      return {
        action,
        targetId: payload?.id,
        targetType: 'verification_request',
        extra: { reviewNote: payload?.reviewNote || null },
      }
    }
    case 'businesses/updateBusinessDocumentStatus': {
      const action =
        payload?.status === 'verified' ? 'document.verified' : 'document.rejected'
      return { action, targetId: payload?.id, targetType: 'business_document' }
    }
    case 'disputes/updateDisputeStatus': {
      const action = `dispute.${payload?.status || 'updated'}`
      return { action, targetId: payload?.id, targetType: 'dispute' }
    }
    default:
      return null
  }
}

export const auditMiddleware = (storeApi) => (next) => (action) => {
  const result = next(action)
  if (
    typeof action.type === 'string' &&
    !excludedActions.has(action.type) &&
    auditedPrefixes.some((prefix) => action.type.startsWith(prefix)) &&
    !action.type.endsWith('/pending')
  ) {
    const user = storeApi.getState().auth.user
    const targetId =
      action.payload?.id || action.payload?.ticketId || action.payload?.conversationId || null

    storeApi.dispatch(
      recordAudit({
        id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`,
        action: action.type,
        actorId: user?.id || null,
        actorRole: user?.role || 'anonymous',
        targetId,
        createdAt: new Date().toISOString(),
      }),
    )

    // Persiste les actions métier importantes dans moxt_audit_log (fire-and-forget)
    const business = resolveBusinessAction(action.type, action.payload)
    if (business) {
      void writeAuditEvent({
        actorId: user?.id || null,
        actorRole: user?.role || 'system',
        action: business.action,
        targetId: business.targetId ? String(business.targetId) : null,
        targetType: business.targetType || null,
        payload: business.extra || {},
      })
    }
  }
  return result
}
