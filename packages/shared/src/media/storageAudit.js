/**
 * Inventaire Supabase Storage → cibles Yandex Object Storage (Phase 1).
 * Source : moxt-react/src/services/storageService.js + migrations supabase/migrations/*storage*
 */
export const SUPABASE_STORAGE_BUCKETS = [
  {
    id: 'avatars',
    visibility: 'public',
    yandexPrefix: 'public/avatars',
    content: 'Photos de profil utilisateur',
    legacyPathPattern: '{userId}/avatar.{ext}',
  },
  {
    id: 'businesses',
    visibility: 'public',
    yandexPrefix: 'public/businesses',
    content: 'Logos et bannières entreprise',
    legacyPathPattern: '{userId}/{businessId}/logo|banner.{ext}',
  },
  {
    id: 'listings',
    visibility: 'public',
    yandexPrefix: 'public/listings',
    content:
      'Marketplace, jobs, events, posts, statuses, messages, support (chemins sous listings/)',
    legacyPathPattern: '{userId}/…',
  },
  {
    id: 'videos',
    visibility: 'public',
    yandexPrefix: 'public/videos',
    content: 'Vidéos entreprise (feed / catalogue publications)',
    legacyPathPattern: '{userId}/{businessId}/{videoId}.{ext}',
  },
  {
    id: 'documents',
    visibility: 'private',
    yandexPrefix: 'private/documents',
    content: 'KYC, identité, documents entreprise',
    legacyPathPattern: '{userId}/…',
  },
  {
    id: 'parcels',
    visibility: 'private',
    yandexPrefix: 'private/parcels',
    content: 'Preuves colis (proof, passport)',
    legacyPathPattern: '{userId}/{parcelId}/…',
  },
  {
    id: 'transfers',
    visibility: 'private',
    yandexPrefix: 'private/transfers',
    content: 'Preuves transfert / P2P / business',
    legacyPathPattern: '{userId}/{transferId}/…',
  },
  {
    id: 'app-releases',
    visibility: 'public',
    yandexPrefix: 'public/releases',
    content: 'Builds APK / releases app',
    legacyPathPattern: '{path}',
  },
]

/** Mapping kind + entity pour media_objects. */
export const MEDIA_KIND_BY_LEGACY_BUCKET = {
  avatars: 'avatar',
  businesses: 'image',
  listings: 'image',
  videos: 'video',
  documents: 'document',
  parcels: 'proof',
  transfers: 'proof',
  'app-releases': 'image',
}
