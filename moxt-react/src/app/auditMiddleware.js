import { recordAudit } from '../features/audit/auditSlice'

const auditedPrefixes = [
  'auth/',
  'transfers/',
  'businesses/',
  'parcels/',
  'p2p/',
  'marketplace/',
  'jobs/',
  'events/',
  'communications/',
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

export const auditMiddleware = (storeApi) => (next) => (action) => {
  const result = next(action)
  if (
    typeof action.type === 'string' &&
    !excludedActions.has(action.type) &&
    auditedPrefixes.some((prefix) => action.type.startsWith(prefix)) &&
    !action.type.endsWith('/pending')
  ) {
    const user = storeApi.getState().auth.user
    storeApi.dispatch(
      recordAudit({
        id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`,
        action: action.type,
        actorId: user?.id || null,
        actorRole: user?.role || 'anonymous',
        targetId:
          action.payload?.id || action.payload?.ticketId || action.payload?.conversationId || null,
        createdAt: new Date().toISOString(),
      }),
    )
  }
  return result
}
