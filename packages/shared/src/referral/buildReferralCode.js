/**
 * Code de parrainage déterministe à partir de l'identifiant utilisateur.
 * Doit rester aligné avec public.moxt_referral_code_from_id() côté Supabase.
 */
export function buildReferralCode(user) {
  const base = (user?.id || user?.email || 'MOXT').toString()
  let hash = 0
  for (let index = 0; index < base.length; index += 1) {
    hash = (hash * 31 + base.charCodeAt(index)) >>> 0
  }
  const suffix = hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
  return `MOXT-${suffix}`
}
