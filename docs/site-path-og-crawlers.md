# Site-path Open Graph (moxtapp.ru entity URLs)

## Problem

In-app share already uses `https://share.moxtapp.ru/share/{kind}/{id}` (real OG).  
When someone pastes a **browser** URL such as `https://moxtapp.ru/parcels/COL-…` into WhatsApp/Telegram, the crawler hits the SPA shell and sees generic `og:image` = `X.png`.

## Safe design (no nuclear CDN rewrite)

1. **`share-preview` Edge** accepts app paths as well as `/share/{kind}/{id}`  
   (`/parcels/:id`, `/marketplace/:id`, …).
2. **`moxt-site-og-shield` Cloud Function** (UA-aware):
   - crawler + entity path → proxy `share-preview`
   - browser → SPA `index.html` from website origin
3. **API Gateway `moxt-site-og`** routes entity prefixes to the shield; `/assets/*` and catch-all → `moxtapp-web.website.yandexcloud.net`.
4. **CDN cutover (optional)**: point CDN HTTP origin at the gateway; **rewrite stays CLEARED**.

### Garde-fou (same as PR #25 / `MOXT_CDN_LOCK`)

| Rule | Value |
|------|--------|
| CDN resource | `bc8rz327qbtedt3vbafl` |
| Origin | `moxtapp-web.website.yandexcloud.net` + `meta.website.name=moxtapp-web` (or gateway domain after cutover) |
| Host header | same as origin host |
| Rewrite | **CLEARED** (never `^/(.*)$`, never PERMANENT/LAST) |
| Bucket website | `index` + `error` = `index.html` |
| Forbidden | Storage API origin `*.storage.yandexcloud.net` |

`assertCdnSpaGuard` aborts CPD if Storage API / nuclear rewrite reappear.

Rollback CDN to website lock:

```powershell
.\infra\site-og-shield\deploy-on-drsam.ps1 -RollbackCdnOrigin
```

## Route → kind map

| App path | share kind |
|----------|------------|
| `/marketplace/:id` | `listing` |
| `/parcels/:id`, `/colis/:id` | `parcel` |
| `/jobs/:id` | `job` |
| `/events/:id` | `event` |
| `/businesses/:id` | `business` |
| `/users/:id/…` | `user` |
| `/p2p/:id` | `p2p` |
| `/news/:id` | `post` |
| `/feed?item=kind:id` | `kind` |

Skipped (SPA only): list pages, `mine` / `publish` / `edit` / `applications` / `p2p/orders/…`.

## Proof commands

```bash
# After share-preview deploy (Edge site paths):
curl -s -A 'WhatsApp/2.23' \
  'https://rbvqfkccbkwjxkvpnwqn.supabase.co/functions/v1/share-preview/parcels/COL-…' \
  | grep -E 'og:(title|image)'

# After gateway deploy (before CDN cutover):
curl -s -A 'WhatsApp/2.23' "https://<gw-domain>/parcels/COL-…" | grep og:title
curl -s -A 'Mozilla/5.0' "https://<gw-domain>/parcels/COL-…" | head -c 200   # SPA

# After CDN cutover:
curl -s -A 'WhatsApp/2.23' 'https://moxtapp.ru/parcels/COL-…' | grep -E 'og:(title|image)'
# og:image must NOT be …/assets/logos/X.png when entity has photo or dynamic card
```

## Still needs yc / cpd (Dr_Sam)

- Deploy `moxt-site-og-shield` + gateway (`infra/site-og-shield/deploy-on-drsam.ps1`)
- Optional `-CutoverCdnOrigin` once gateway proof passes
- Restore website CDN lock if currently on Storage API (`restore-moxtapp-cdn.ps1` / `-RollbackCdnOrigin`)
- CPD for website assets is independent (other agent)
