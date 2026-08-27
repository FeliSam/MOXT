# Yandex Object Storage — média MOXT (Phase 1)

PostgreSQL reste chez **Supabase** (`media_objects`). Les fichiers (images, vidéos, documents) migrent vers **Yandex Object Storage**.

## Buckets

| Bucket Yandex   | Visibilité | Contenu                                      |
|-----------------|------------|----------------------------------------------|
| `moxt-public`   | Public     | avatars, listings, vidéos feed, logos, APK   |
| `moxt-private`  | Privé      | documents KYC, preuves colis/transferts      |

Préfixes S3 : voir `packages/shared/src/media/storageAudit.js`.

## Provisionnement

```bash
# Crée les buckets + lifecycle (status 24h) + clés IAM
npm run setup:yandex-media

# Secrets Edge Function media-api (Supabase linked)
npx supabase secrets set YANDEX_S3_ACCESS_KEY_ID="..." --linked
npx supabase secrets set YANDEX_S3_SECRET_ACCESS_KEY="..." --linked
npx supabase secrets set YANDEX_S3_ENDPOINT="https://storage.yandexcloud.net" --linked
npx supabase secrets set YANDEX_S3_REGION="ru-central1" --linked
npx supabase secrets set YANDEX_S3_PUBLIC_BUCKET="moxt-public" --linked
npx supabase secrets set YANDEX_S3_PRIVATE_BUCKET="moxt-private" --linked
npx supabase secrets set MOXT_MEDIA_CDN_BASE="https://cdn.moxtapp.ru" --linked

# Migration SQL + déploiement Edge Function
npm run db:push
npx supabase functions deploy media-api --linked
```

## CDN

- Domaine recommandé : `cdn.moxtapp.ru` → origine bucket `moxt-public`
- Cache-Control upload : `public, max-age=31536000, immutable` (fichiers versionnés)
- Thumbnails : variants pré-générés à l’upload (512, 1600, 96px) — pas de resize dynamique côté CDN

## Lifecycle (économie)

| Préfixe                    | Règle                          |
|----------------------------|--------------------------------|
| `public/videos/status/`    | Expiration 24 h (stories)      |
| `private/*/temp/`          | Expiration 7 j                 |
| Archives admin (optionnel)   | Transition vers storage class Cold |

## Variables client (moxt-react)

```env
VITE_MEDIA_YANDEX_ENABLED=true
VITE_MEDIA_CDN_BASE=https://cdn.moxtapp.ru
VITE_MEDIA_PUBLIC_BUCKET=moxt-public
VITE_MEDIA_PRIVATE_BUCKET=moxt-private
# Cutover Phase 4 :
# VITE_MEDIA_SUPABASE_UPLOADS_DISABLED=true
```

## Migration batch Supabase → Yandex

```bash
# Dry-run (liste les objets)
node scripts/migrate-supabase-to-yandex.mjs --dry-run

# Avatars puis listings
node scripts/migrate-supabase-to-yandex.mjs --bucket=avatars
node scripts/migrate-supabase-to-yandex.mjs --bucket=listings --limit=500
```

## Flux upload (résumé)

1. Client → `media-api` presign → row `media_objects` status=pending
2. Client → PUT direct Yandex
3. Client → `media-api` finalize → status=ready + `public_url` CDN

## Cutover Supabase Storage

1. Dual-write : `VITE_MEDIA_YANDEX_ENABLED=true` (fallback Supabase si échec Yandex)
2. Dual-read : résolveur URL CDN + legacy Supabase (`mediaUrlUtils.js`)
3. Backfill : script migration + `legacy_supabase_url` en base
4. Cutover : `VITE_MEDIA_SUPABASE_UPLOADS_DISABLED=true`
5. Purge buckets Supabase après 30 j de grâce
