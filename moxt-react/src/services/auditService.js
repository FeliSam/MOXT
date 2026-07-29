import { supabase } from './supabaseClient'

/**
 * Écrit un événement d'audit métier dans moxt_audit_log via RPC SECURITY DEFINER.
 * Fire-and-forget : les erreurs sont avalées pour ne jamais bloquer l'action métier.
 */
export async function writeAuditEvent({
  actorId,
  actorRole,
  action,
  targetId,
  targetType,
  payload = {},
}) {
  if (!supabase) return
  try {
    await supabase.rpc('moxt_write_audit_event', {
      p_actor_id: actorId || null,
      p_actor_role: actorRole || 'system',
      p_action: action,
      p_target_id: targetId ? String(targetId) : null,
      p_target_type: targetType || null,
      p_payload: payload,
    })
  } catch {
    // Ne pas bloquer l'action métier si l'audit échoue
  }
}
