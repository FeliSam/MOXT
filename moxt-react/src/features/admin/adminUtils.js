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
  if (['completed', 'active', 'published', 'resolved', 'verified'].includes(status)) return 'bg-emerald-500'
  if (['pending', 'pending_review', 'open', 'new', 'waiting_payment', 'created', 'accepted'].includes(status)) return 'bg-amber-400'
  if (['cancelled', 'rejected', 'suspended', 'hidden', 'disputed'].includes(status)) return 'bg-red-500'
  return 'bg-slate-400'
}
