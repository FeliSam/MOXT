# Inventaire Supabase Storage → Yandex (Phase 1)

Source de vérité code : `packages/shared/src/media/storageAudit.js`

## Buckets Supabase actuels

| Bucket | Visibilité | Préfixe Yandex | Contenu |
|--------|------------|----------------|---------|
| `avatars` | public | `public/avatars/` | Photos profil |
| `businesses` | public | `public/businesses/` | Logos, bannières |
| `listings` | public | `public/listings/` | Marketplace, jobs, events, posts, statuses, messages, support |
| `documents` | private | `private/documents/` | KYC, identité |
| `parcels` | private | `private/parcels/` | Preuves colis |
| `transfers` | private | `private/transfers/` | Preuves transfert / P2P |
| `app-releases` | public | `public/releases/` | APK |

## Colonnes métier avec URLs (dual-read)

Les colonnes existantes (`profiles.avatar_url`, `listings.images`, chemins documents…) restent en place pendant la migration. Le résolveur client (`mediaUrlUtils.js`, `listingImageUtils.js`, `avatarDisplayUrl.js`) accepte :

- URLs legacy Supabase Storage
- URLs CDN Yandex (`VITE_MEDIA_CDN_BASE`)
- Chemins relatifs listings (résolus via CDN ou Supabase)

## Registry PostgreSQL

Table `media_objects` (migration `20260827100000_media_objects.sql`) — métadonnées uniquement, jamais les bytes.
