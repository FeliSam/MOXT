# moxt-site-og-shield

Crawler-only Open Graph for **moxtapp.ru** entity paths (`/parcels/…`, `/marketplace/…`, …).

Browsers still receive the SPA `index.html`. WhatsApp/Telegram UAs get `share-preview` HTML (real `og:title` / `og:image`).

## Why not CDN rewrite?

Yandex CDN cannot branch on `User-Agent`. A path rewrite that always serves OG HTML would break the SPA for humans; the old nuclear `^/(.*)$ → /index.html` also served HTML as JS. **Do not reintroduce that.**

## Deploy

On Dr_Sam (yc authenticated):

```powershell
cd C:\Users\felic\Videos\Moxt-wt-cpd\infra\site-og-shield
.\deploy-on-drsam.ps1
# after gateway proof OK:
.\deploy-on-drsam.ps1 -CutoverCdnOrigin
# emergency:
.\deploy-on-drsam.ps1 -RollbackCdnOrigin
```

## Route → kind

| App path | kind |
|----------|------|
| `/marketplace/:id` | listing |
| `/parcels/:id` | parcel |
| `/jobs/:id` | job |
| `/events/:id` | event |
| `/businesses/:id` | business |
| `/users/:id/…` | user |
| `/p2p/:id` | p2p |
| `/news/:id` | post |
| `/feed?item=kind:id` | kind |

Reserved screens (`mine`, `publish`, `edit`, …) stay SPA-only.
