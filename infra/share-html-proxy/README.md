# moxt-share-html-proxy

Yandex Cloud Function behind API Gateway `d5doerdoffl4db9ij8j5` (`share.moxtapp.ru`).

## Routing

Gateway OpenAPI path **`/share/{proxy+}`** already proxies both:

- `/share/{kind}/{id}` → HTML OG preview (Content-Type forced to `text/html`)
- `/share/og-card/{kind}/{id}` → dynamic OG card image (`image/png`, base64)

No extra gateway path is required for og-card.

## Deploy (Dr_Sam / yc)

```powershell
cd C:\Users\felic\Videos\Moxt-wt-cpd\infra\share-html-proxy
# zip index.js + package.json, then:
yc serverless function version create --function-name=moxt-share-html-proxy `
  --runtime=nodejs18 --entrypoint=index.handler --memory=128m --execution-timeout=15s `
  --source-path=.\proxy.zip `
  --environment SHARE_PREVIEW_UPSTREAM=https://rbvqfkccbkwjxkvpnwqn.supabase.co/functions/v1/share-preview
```

Or run `infra/share-html-proxy/deploy-on-drsam.ps1`.

## WhatsApp note

WhatsApp/Facebook do **not** render SVG as `og:image`. Prefer PNG from `share-preview` (resvg-wasm). If PNG render fails, SVG is returned — previews may stay blank on WA until PNG works.
