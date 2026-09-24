# Dynamic OG cards

When an entity has no photo, `share-preview` sets `og:image` to:

`https://share.moxtapp.ru/share/og-card/{kind}/{id}`

instead of the static `https://moxtapp.ru/assets/logos/X.png`.

## Pipeline

1. **API Gateway** `moxt-share` (`d5doerdoffl4db9ij8j5`) — path `/share/{proxy+}`  
   Same route for HTML previews and og-card images (no separate path needed).
2. **Cloud Function** `moxt-share-html-proxy` — forces `text/html` for crawler HTML; for `og-card/*` passes through `image/png` (base64).
3. **Supabase Edge** `share-preview` — builds SVG card + renders PNG via `@resvg/resvg-wasm`.

## WhatsApp / Facebook

They typically **ignore SVG** `og:image`. PNG is required. If wasm render fails, the function falls back to SVG and sets `X-MOXT-OG-Fallback: svg`.

## Fonts (critical)

Edge Functions have **no system fonts**. `resvg` must load Inter via `fontBuffers`
(see `MOXT_OG_CARD_FONT_URL`, default Inter Variable on jsDelivr). Without that,
PNG cards are a blank teal gradient with circles (WhatsApp shows virgin preview).

Redeploy after font fixes:

```bash
supabase functions deploy share-preview --project-ref rbvqfkccbkwjxkvpnwqn
```

Purge WhatsApp/Facebook cache: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
with the share URL, or append `?v=2` once to bust.

## Parcel / job / event card facts

When an entity has no photo, the generated PNG includes structured facts when present in DB (missing fields are omitted):

- **parcel**: route title (`origin → destination`), `departure_date` (FR short), `price_per_kg` + `currency` (/kg)
- **job**: `start_date`, `salary` (+ `salary_period`)
- **event**: `start_at`, price/`currency` or "Entrée gratuite" when `free_entry`

Crawler `og:description` mirrors title · facts when available.
