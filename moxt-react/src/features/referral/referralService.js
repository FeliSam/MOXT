import { supabase } from '../../services/supabaseClient'
import { clearPendingInviteCode, readPendingInviteCode } from '../guest/guestNavigation'

export async function applyPendingReferral() {
  const code = readPendingInviteCode()
  if (!code || !supabase) return false

  try {
    const { data, error } = await supabase.rpc('moxt_apply_referral', { p_code: code })
    if (error) {
      console.warn('[MOXT] Parrainage non appliqué:', error.message)
      return false
    }
    return Boolean(data)
  } catch (err) {
    console.warn('[MOXT] Parrainage non appliqué:', err)
    return false
  } finally {
    clearPendingInviteCode()
  }
}

export async function loadInviteCount(userId) {
  if (!supabase || !userId) return 0

  const { count, error } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId)

  if (error) {
    console.warn('[MOXT] Compteur invitations:', error.message)
    return 0
  }

  return count ?? 0
}
