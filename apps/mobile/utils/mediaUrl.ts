import { buildPublicMediaUrl } from '@moxt/shared/media/objectKeys.js';

import { supabase } from '@/services/supabase';

/** Direct Object Storage — preferred over cdn.moxtapp.ru (CDN lags on new objects). */
export const YANDEX_PUBLIC_STORAGE_BASE = 'https://storage.yandexcloud.net/moxt-public';
const LEGACY_CDN_BASE = 'https://cdn.moxtapp.ru';

/** Rewrite legacy CDN host to Object Storage so fresh uploads are readable immediately. */
export function rewriteCdnToStorageUrl(url: string | null | undefined) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (trimmed.startsWith(LEGACY_CDN_BASE)) {
    return `${YANDEX_PUBLIC_STORAGE_BASE}${trimmed.slice(LEGACY_CDN_BASE.length)}`;
  }
  return trimmed;
}

/**
 * Résout une URL d’affichage : Object Storage Yandex, legacy Supabase, ou chemin relatif.
 * Miroir de moxt-react/src/services/media/mediaUrlUtils.js.
 */
export function resolveMediaDisplayUrl(
  value: unknown,
  { legacyBucket = 'listings' }: { legacyBucket?: string } = {},
): string | null {
  if (!value) return null;
  const raw =
    typeof value === 'string'
      ? value
      : (value as { url?: string; publicUrl?: string; src?: string; path?: string })?.url ||
        (value as { publicUrl?: string })?.publicUrl ||
        (value as { src?: string })?.src ||
        (value as { path?: string })?.path ||
        '';
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    const absolute = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    return rewriteCdnToStorageUrl(absolute) || null;
  }
  if (trimmed.startsWith('/')) return trimmed;
  const key =
    trimmed.startsWith('public/') || trimmed.startsWith('private/')
      ? trimmed
      : `public/${legacyBucket}/${trimmed.replace(/^\/+/, '')}`;
  return rewriteCdnToStorageUrl(buildPublicMediaUrl(key, YANDEX_PUBLIC_STORAGE_BASE)) || null;
}

function parseImagesValue(value: unknown): unknown[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value.trim() ? [value] : [];
    }
  }
  return [];
}

export function resolveListingImageUrl(value: unknown): string | null {
  const resolved = resolveMediaDisplayUrl(value, { legacyBucket: 'listings' });
  if (resolved) return resolved;
  if (!value) return null;
  const raw =
    typeof value === 'string'
      ? value
      : (value as { url?: string; src?: string; path?: string })?.url ||
        (value as { src?: string })?.src ||
        (value as { path?: string })?.path ||
        '';
  const trimmed = String(raw).trim();
  if (!trimmed || !supabase) return trimmed || null;
  const { data } = supabase.storage.from('listings').getPublicUrl(trimmed);
  return data?.publicUrl || trimmed;
}

/** Première source non vide → URLs absolues affichables (miroir web normalizeListingImages). */
export function normalizeListingImages(...sources: unknown[]): string[] {
  for (const source of sources) {
    const urls = parseImagesValue(source).map(resolveListingImageUrl).filter(Boolean) as string[];
    if (urls.length) return urls;
  }
  return [];
}
