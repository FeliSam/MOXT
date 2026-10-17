import { supabase } from './supabase';

export type StarsPackage = {
  id: string;
  stars: number;
  bonus_stars?: number;
  price_rub: number;
  title?: string;
  active?: boolean;
  sort_order?: number;
};

export type StarsPurchase = {
  id: string;
  package_id: string;
  stars: number;
  bonus_stars?: number;
  price_rub: number;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
};

export type StarsTransaction = {
  id: string;
  amount: number;
  category?: string;
  type?: 'credit' | 'debit';
  label?: string;
  headline?: string;
  created_at: string;
};

export type StarsBalance = {
  paid: number;
  bonusPool: number;
  personalBonus?: number;
  businessBonus?: number;
  combinedTotal?: number;
  total: number;
  quotas?: {
    pool?: number;
    personal?: number;
    business?: number;
  };
};

export const DEFAULT_PACKAGES: StarsPackage[] = [
  { id: 'pack-25', stars: 25, bonus_stars: 0, price_rub: 250, title: 'Starter' },
  { id: 'pack-50', stars: 50, bonus_stars: 5, price_rub: 450, title: 'Standard' },
  { id: 'pack-150', stars: 150, bonus_stars: 25, price_rub: 1200, title: 'Pro' },
  { id: 'pack-250', stars: 250, bonus_stars: 50, price_rub: 1900, title: 'Expert' },
  { id: 'pack-400', stars: 400, bonus_stars: 100, price_rub: 2900, title: 'Business' },
  { id: 'pack-1000', stars: 1000, bonus_stars: 350, price_rub: 6900, title: 'Ultimate' },
];

export const STARS_PACK_META: Record<string, { gradient: [string, string]; glow: string; badge: 'popular' | 'best' | null }> = {
  'pack-25': { gradient: ['#71717a', '#3f3f46'], glow: '#a1a1aa', badge: null },
  'pack-50': { gradient: ['#475569', '#1e293b'], glow: '#94a3b8', badge: null },
  'pack-150': { gradient: ['#0d9488', '#0891b2'], glow: '#22d3ee', badge: 'popular' },
  'pack-250': { gradient: ['#4f46e5', '#1d4ed8'], glow: '#818cf8', badge: null },
  'pack-400': { gradient: ['#f59e0b', '#7c3aed'], glow: '#fbbf24', badge: null },
  'pack-1000': { gradient: ['#f43f5e', '#8b5cf6'], glow: '#fb7185', badge: 'best' },
};

export function starsPackMeta(packId: string, index = 0) {
  if (STARS_PACK_META[packId]) return STARS_PACK_META[packId];
  const keys = Object.keys(STARS_PACK_META);
  return STARS_PACK_META[keys[index % keys.length]];
}

async function rpc(name: string, params: Record<string, unknown>) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw error;
  return data;
}

export async function fetchStarsBalance(ownerType = 'user', ownerId: string | null = null): Promise<StarsBalance> {
  if (!supabase) return { paid: 0, bonusPool: 60, total: 60 };
  try {
    const data = await rpc('stars_get_balance', {
      p_owner_type: ownerType,
      p_owner_id: ownerId,
    });
    if (data) {
      const paid = Number(data.paid || 0);
      const bonus = Number(data.bonus_pool || data.bonusPool || 60);
      return {
        paid,
        bonusPool: bonus,
        personalBonus: Number(data.personal_bonus || data.personalBonus || bonus),
        businessBonus: Number(data.business_bonus || data.businessBonus || 0),
        total: paid + bonus,
        quotas: { pool: 60 },
      };
    }
  } catch {
    // fallback
  }
  return { paid: 0, bonusPool: 60, total: 60, quotas: { pool: 60 } };
}

export async function fetchStarsPackages(): Promise<StarsPackage[]> {
  if (!supabase) return DEFAULT_PACKAGES;
  try {
    const { data, error } = await supabase
      .from('stars_packages')
      .select('*')
      .eq('active', true)
      .order('sort_order');
    if (!error && data && data.length) return data as StarsPackage[];
  } catch {
    // fallback
  }
  return DEFAULT_PACKAGES;
}

export async function fetchStarsPurchases(): Promise<StarsPurchase[]> {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('stars_purchases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    return (data || []) as StarsPurchase[];
  } catch {
    return [];
  }
}

export async function fetchStarsPurchase(purchaseId: string): Promise<StarsPurchase | null> {
  if (!supabase || !purchaseId) return null;
  const { data } = await supabase
    .from('stars_purchases')
    .select('*')
    .eq('id', purchaseId)
    .maybeSingle();
  return (data || null) as StarsPurchase | null;
}

export async function createStarsPurchase({
  packageId,
  idempotencyKey,
  ownerType = 'user',
  ownerId = null,
}: {
  packageId: string;
  idempotencyKey: string;
  ownerType?: string;
  ownerId?: string | null;
}) {
  return rpc('stars_create_purchase', {
    p_package_id: packageId,
    p_idempotency_key: idempotencyKey,
    p_owner_type: ownerType,
    p_owner_id: ownerId,
  });
}

export async function completeStubPurchase(purchaseId: string, success = true) {
  return rpc('stars_complete_stub_purchase', {
    p_purchase_id: purchaseId,
    p_success: success,
  });
}

export async function listStarsTransactions(ownerType = 'user', ownerId: string | null = null): Promise<StarsTransaction[]> {
  if (!supabase) return [];
  try {
    const data = await rpc('stars_list_transactions', {
      p_owner_type: ownerType,
      p_owner_id: ownerId,
      p_limit: 50,
      p_offset: 0,
    });
    return (data || []).map((row: any) => ({
      id: String(row.id),
      amount: Number(row.amount || row.stars || 0),
      category: row.category,
      type: row.amount < 0 || row.direction === 'out' ? 'debit' : 'credit',
      label: row.headline || row.label || 'Opération Stars',
      created_at: row.created_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
