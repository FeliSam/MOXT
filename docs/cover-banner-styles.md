# Moxt premium cover banners

Empty-state covers (no custom `bannerUrl` / cover photo) use CSS + SVG styles.

## Defaults

| Audience | Default style ID | Label |
|---|---|---|
| Business | `business-b-editorial` | Editorial dark |
| Personal woman | `woman-a-silk` | Silk plum |
| Personal man / unknown gender | `man-a-steel` | Steel teal |

## Style IDs

Business: `business-a-mesh`, `business-b-editorial`, `business-c-glass`, `business-d-topo`  
Women: `woman-a-silk`, `woman-b-glass`, `woman-c-blush`  
Men: `man-a-steel`, `man-b-topo`, `man-c-mesh`

## Persistence (no new SQL column)

- **Business** → `businesses.payload.coverStyle` (jsonb; existing column). Synced via `businessRemote.businessToRemoteRow`.
- **Personal** → `profiles.preferences.coverStyle` (jsonb; existing column) via `updateAccountPreferences`.

No migration required. Documented here for operators.

## Gender

No dedicated `gender` column on `profiles` today. Resolver accepts optional `user.gender` / metadata aliases (`femme`, `homme`, …). Unknown → **man-a-steel**. Personal picker shows Homme / Femme tabs when gender is missing.

## How to change style (UI)

1. **Business** — Setup entreprise → identité visuelle → section « Style de bannière Moxt » (only when no custom banner photo).
2. **Personal** — Profil → Informations personnelles → carte « Bannière Moxt ».
3. Custom cover/banner photo always wins; Moxt styles apply only to the empty state.

## Code

- Catalog: `moxt-react/src/features/publications/coverBanners/coverBannerCatalog.js`
- Renderer: `MoxtCoverBanner.jsx` + style components
- Picker: `CoverStylePicker.jsx`
- Hero: `PublicProfileHero` props `coverStyle`, `coverCategory`, `gender`, legacy `emptyCoverVariant`
