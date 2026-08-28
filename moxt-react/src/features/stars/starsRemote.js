import { supabase } from '../../services/supabaseClient'

async function rpc(name, params) {
  if (!supabase) {
    const error = new Error('Supabase indisponible')
    error.code = 'offline'
    throw error
  }
  const { data, error } = await supabase.rpc(name, params)
  if (error) throw error
  return data
}

export function starsRpc(name, params) {
  return rpc(name, params)
}

export function fetchStarsBalance({ ownerType = 'user', ownerId = null } = {}) {
  return rpc('stars_get_balance', {
    p_owner_type: ownerType,
    p_owner_id: ownerId,
  })
}

export function quoteStarsAction({
  category,
  ownerType = 'user',
  ownerId = null,
  durationKey = null,
  formulaKey = 'standard',
} = {}) {
  return rpc('stars_quote', {
    p_category: category,
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_duration_key: durationKey,
    p_formula_key: formulaKey,
  })
}

export function consumeStars({
  category,
  idempotencyKey,
  ownerType = 'user',
  ownerId = null,
  durationKey = null,
  formulaKey = 'standard',
  refType = null,
  refId = null,
} = {}) {
  return rpc('stars_consume', {
    p_category: category,
    p_idempotency_key: idempotencyKey,
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_duration_key: durationKey,
    p_formula_key: formulaKey,
    p_ref_type: refType,
    p_ref_id: refId,
  })
}

export function refundFailedStarsPublish({
  idempotencyKey,
  ownerType = 'user',
  ownerId = null,
} = {}) {
  return rpc('stars_refund_failed_publish', {
    p_idempotency_key: idempotencyKey,
    p_owner_type: ownerType,
    p_owner_id: ownerId,
  })
}

export function listStarsTransactions({
  ownerType = 'user',
  ownerId = null,
  limit = 30,
  offset = 0,
} = {}) {
  return rpc('stars_list_transactions', {
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_limit: limit,
    p_offset: offset,
  })
}

export function fetchStarsPurchase(purchaseId) {
  if (!supabase || !purchaseId) return Promise.resolve(null)
  return supabase
    .from('stars_purchases')
    .select('*')
    .eq('id', purchaseId)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) throw error
      return data
    })
}

export function completeStubPurchase(purchaseId, success = true) {
  return rpc('stars_complete_stub_purchase', {
    p_purchase_id: purchaseId,
    p_success: success,
  })
}

export async function createStarsPurchase({
  packageId,
  idempotencyKey,
  ownerType = 'user',
  ownerId = null,
} = {}) {
  if (supabase?.functions?.invoke) {
    const { data, error } = await supabase.functions.invoke('stars-purchase', {
      body: { packageId, idempotencyKey, ownerType, ownerId },
    })
    if (!error && data && !data.error) return data
  }
  return rpc('stars_create_purchase', {
    p_package_id: packageId,
    p_idempotency_key: idempotencyKey,
    p_owner_type: ownerType,
    p_owner_id: ownerId,
  })
}

export function quoteStarsBoost({
  entityType,
  ownerType = 'user',
  ownerId = null,
  durationKey = '24h',
} = {}) {
  return rpc('stars_quote_boost', {
    p_entity_type: entityType,
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_duration_key: durationKey,
  })
}

export function applyStarsBoost({
  entityType,
  entityId,
  durationKey,
  idempotencyKey,
  ownerType = 'user',
  ownerId = null,
} = {}) {
  return rpc('stars_apply_boost', {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_duration_key: durationKey,
    p_idempotency_key: idempotencyKey,
    p_owner_type: ownerType,
    p_owner_id: ownerId,
  })
}

export function expireFeedBoosts() {
  return rpc('stars_expire_boosts', {}).catch(() => ({ expired: 0 }))
}

export function fetchFeedBoosts() {
  if (!supabase) return Promise.resolve([])
  return supabase
    .from('stars_boosts')
    .select('entity_type, entity_id, formula_key, expires_at, status')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .then(({ data, error }) => {
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') return []
        throw error
      }
      return data || []
    })
    .catch(() => [])
}

export function fetchStarsQuotaConfig() {
  if (!supabase) return Promise.resolve(null)
  return supabase
    .from('stars_quota_config')
    .select('config')
    .eq('id', 1)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) throw error
      return data?.config || null
    })
}

export function fetchStarsPackages() {
  if (!supabase) return Promise.resolve([])
  return supabase
    .from('stars_packages')
    .select('*')
    .eq('active', true)
    .order('sort_order')
    .then(({ data, error }) => {
      if (error) throw error
      return data || []
    })
}

export function fetchStarsPurchases() {
  if (!supabase) return Promise.resolve([])
  return supabase
    .from('stars_purchases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
    .then(({ data, error }) => {
      if (error) throw error
      return data || []
    })
}

export function adminStarsOverview() {
  return rpc('stars_admin_overview', {})
}

export function adminStarsSuspects() {
  return rpc('stars_admin_suspects', {})
}

export function adminUpdateStarsConfig(config) {
  return rpc('stars_admin_update_config', { p_config: config })
}

export function adminAdjustStars({ ownerType, ownerId, amount, reason }) {
  return rpc('stars_admin_adjust', {
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_amount: amount,
    p_reason: reason,
  })
}

export function adminFulfillPurchase(purchaseId) {
  return rpc('stars_fulfill_purchase', { p_purchase_id: purchaseId })
}

export function adminFailPurchase(purchaseId) {
  return rpc('stars_fail_purchase', { p_purchase_id: purchaseId })
}

export function adminSeedBonusProrata() {
  return rpc('stars_seed_bonus_prorata', {})
}

export function giftStarsToPublisher({
  recipientType,
  recipientId,
  amount,
  idempotencyKey,
  message = null,
} = {}) {
  return rpc('stars_gift_to_publisher', {
    p_recipient_type: recipientType,
    p_recipient_id: recipientId,
    p_amount: amount,
    p_idempotency_key: idempotencyKey,
    p_message: message,
  })
}
