/**
 * Transporteurs d’expédition courants en Russie (marketplace).
 * `etaKey` → i18n `marketplace.shipping.eta.*`
 */
export const RUSSIA_SHIPPING_CARRIERS = [
  {
    id: 'cdek',
    labelKey: 'marketplace.shipping.carriers.cdek',
    etaKey: 'marketplace.shipping.eta.cdek',
    etaHint: '2–7 jours',
  },
  {
    id: 'pochta',
    labelKey: 'marketplace.shipping.carriers.pochta',
    etaKey: 'marketplace.shipping.eta.pochta',
    etaHint: '5–14 jours',
  },
  {
    id: 'boxberry',
    labelKey: 'marketplace.shipping.carriers.boxberry',
    etaKey: 'marketplace.shipping.eta.boxberry',
    etaHint: '2–6 jours',
  },
  {
    id: 'yandex',
    labelKey: 'marketplace.shipping.carriers.yandex',
    etaKey: 'marketplace.shipping.eta.yandex',
    etaHint: '1–3 jours',
  },
  {
    id: 'dellin',
    labelKey: 'marketplace.shipping.carriers.dellin',
    etaKey: 'marketplace.shipping.eta.dellin',
    etaHint: '3–10 jours',
  },
  {
    id: 'pek',
    labelKey: 'marketplace.shipping.carriers.pek',
    etaKey: 'marketplace.shipping.eta.pek',
    etaHint: '3–10 jours',
  },
  {
    id: 'other',
    labelKey: 'marketplace.shipping.carriers.other',
    etaKey: 'marketplace.shipping.eta.other',
    etaHint: 'À convenir',
  },
]

export function carrierById(id) {
  return RUSSIA_SHIPPING_CARRIERS.find((item) => item.id === id) || null
}

export function normalizeShippingCarriers(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const meta = carrierById(item)
        return meta ? { id: meta.id, etaHint: meta.etaHint } : null
      }
      if (item && typeof item === 'object' && item.id) {
        const meta = carrierById(item.id)
        if (!meta) return null
        return {
          id: meta.id,
          etaHint: String(item.etaHint || meta.etaHint || '').trim() || meta.etaHint,
        }
      }
      return null
    })
    .filter(Boolean)
}
