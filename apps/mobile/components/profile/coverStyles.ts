/**
 * Styles de bannière Moxt — portage de
 * moxt-react/src/features/publications/coverBanners/coverBannerCatalog.js (résolution seule).
 */
export const COVER_STYLE_IDS = {
  BUSINESS_A_MESH: 'business-a-mesh',
  BUSINESS_B_EDITORIAL: 'business-b-editorial',
  BUSINESS_C_GLASS: 'business-c-glass',
  BUSINESS_D_TOPO: 'business-d-topo',
  WOMAN_A_SILK: 'woman-a-silk',
  WOMAN_B_GLASS: 'woman-b-glass',
  WOMAN_C_BLUSH: 'woman-c-blush',
  MAN_A_STEEL: 'man-a-steel',
  MAN_B_TOPO: 'man-b-topo',
  MAN_C_MESH: 'man-c-mesh',
  WOMAN_D_PRUNE: 'woman-d-prune',
  MAN_D_PRUNE: 'man-d-prune',
} as const;

export type CoverStyleId = (typeof COVER_STYLE_IDS)[keyof typeof COVER_STYLE_IDS];
const ALL = new Set<string>(Object.values(COVER_STYLE_IDS));

export function isCoverStyleId(value: unknown): value is CoverStyleId {
  return typeof value === 'string' && ALL.has(value);
}

export function normalizeProfileGender(gender: unknown): 'female' | 'male' | null {
  const raw = String(gender || '').trim().toLowerCase();
  if (!raw) return null;
  if (['f', 'female', 'femme', 'woman', 'w', 'madame', 'mlle', 'mme', 'she', 'her'].includes(raw)) return 'female';
  if (['m', 'male', 'homme', 'man', 'h', 'monsieur', 'mr', 'he', 'him'].includes(raw)) return 'male';
  return null;
}

export function genderFromPreferences(preferences: Record<string, any> | null | undefined): string | null {
  return preferences?.gender || preferences?.avatarDicebear?.preferences?.gender || null;
}

export function defaultCoverStyleForPersonal(gender: unknown): CoverStyleId {
  return normalizeProfileGender(gender) === 'female' ? COVER_STYLE_IDS.WOMAN_D_PRUNE : COVER_STYLE_IDS.MAN_D_PRUNE;
}

export function resolveCoverStyleId({
  coverStyle,
  category = 'personal',
  gender,
}: {
  coverStyle?: unknown;
  category?: 'personal' | 'business';
  gender?: unknown;
}): CoverStyleId {
  if (isCoverStyleId(coverStyle)) return coverStyle;
  if (category === 'business') return COVER_STYLE_IDS.BUSINESS_B_EDITORIAL;
  return defaultCoverStyleForPersonal(gender);
}
