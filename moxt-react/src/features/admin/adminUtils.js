export function initials(name = '') {
  return name.split(' ').map((w) => w[0] || '').slice(0, 2).join('').toUpperCase()
}

export function avatarColor(name = '') {
  const palettes = [
    'bg-[#0f766e] text-white', 'bg-[#1d4ed8] text-white', 'bg-[#7c3aed] text-white',
    'bg-[#b45309] text-white', 'bg-[#be123c] text-white', 'bg-[#065f46] text-white',
  ]
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return palettes[hash % palettes.length]
}

export function statusDotColor(status) {
  if (
    ['completed', 'active', 'published', 'resolved', 'verified', 'paid_out', 'payment_received'].includes(
      status,
    )
  ) {
    return 'bg-emerald-500'
  }
  if (
    [
      'pending',
      'pending_review',
      'pending_payment',
      'pending_business_acceptance',
      'payment_declared',
      'processing',
      'open',
      'new',
      'waiting_payment',
      'created',
      'accepted',
    ].includes(status)
  ) {
    return 'bg-amber-400'
  }
  if (
    ['cancelled', 'rejected', 'suspended', 'hidden', 'disputed', 'expired', 'business_declined'].includes(
      status,
    )
  ) {
    return 'bg-red-500'
  }
  return 'bg-slate-400'
}

export const ADMIN_PAGE_SIZE = 15

export function paginateItems(items, page, pageSize = ADMIN_PAGE_SIZE) {
  const list = Array.isArray(items) ? items : []
  const total = list.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(1, Number(page) || 1), pageCount)
  const start = (safePage - 1) * pageSize
  return {
    page: safePage,
    pageCount,
    pageSize,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    items: list.slice(start, start + pageSize),
  }
}
