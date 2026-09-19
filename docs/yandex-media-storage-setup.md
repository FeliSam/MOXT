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

Secrets locaux (ne jamais commit) : `scripts/phase2.yandex-media.env` (`MOXT_YC_S3_*`),
plus `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ACCESS_TOKEN` via `phase2.supabase-secrets.env` ou `phase2.env`.

`media_objects.owner_id` est **NOT NULL** + FK `auth.users` (voir `20260827100000_media_objects.sql`).
Si le UUID deviné depuis le chemin n’existe pas : l’objet S3 est quand même uploadé, la ligne
`media_objects` est ignorée (log `S3 OK, skip media_objects`).

```bash
# Charger les secrets (bash / Git Bash)
set -a; source scripts/phase2.yandex-media.env; set +a

# Dry-run (liste N objets sans tout parcourir)
node scripts/migrate-supabase-to-yandex.mjs --dry-run --bucket=videos --limit=20

# 1) Vidéos d’abord (plus gros egress Cached Fil/feed)
node scripts/migrate-supabase-to-yandex.mjs --bucket=videos --limit=200
node scripts/migrate-supabase-to-yandex.mjs --bucket=videos --limit=200 --offset=200

# 2) Listings / images marketplace
node scripts/migrate-supabase-to-yandex.mjs --bucket=listings --limit=500

# 3) Avatars / businesses (plus légers)
node scripts/migrate-supabase-to-yandex.mjs --bucket=avatars --limit=500
node scripts/migrate-supabase-to-yandex.mjs --bucket=businesses --limit=200

# Rewrite URLs live (Supabase Storage → https://cdn.moxtapp.ru/...)
# Ne réécrit que si l’objet existe déjà sur Yandex/CDN (HEAD), sauf --skip-cdn-check
node scripts/rewrite-supabase-urls-to-cdn.mjs --dry-run --tables=videos --limit=50
node scripts/rewrite-supabase-urls-to-cdn.mjs --tables=videos,listings --limit=500
node scripts/rewrite-supabase-urls-to-cdn.mjs --tables=profiles,posts,statuses,businesses --limit=500

# Ou migrate + rewrite dans le même run (après uploads réussis)
node scripts/migrate-supabase-to-yandex.mjs --bucket=videos --limit=100 --rewrite-urls
```

npm : `npm run migrate:media:yandex -- --bucket=videos --limit=50`
npm : `npm run rewrite:media:cdn -- --tables=videos --dry-run`

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
