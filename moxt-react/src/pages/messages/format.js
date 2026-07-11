export function initials(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function shortTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
  }
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date)
}

export function formatDateLabel(date) {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === now.toDateString()) return "Aujourd'hui"
  if (date.toDateString() === yesterday.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function peerActivityLabel(updatedAt) {
  if (!updatedAt) return 'Nouvelle conversation'
  const date = new Date(updatedAt)
  const diff = Date.now() - date.getTime()
  if (diff < 5 * 60 * 1000) return 'Actif récemment'
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.max(1, Math.floor(diff / 60000))
    return `Vu il y a ${minutes} min`
  }
  if (date.toDateString() === new Date().toDateString()) {
    return `Actif aujourd'hui · ${shortTime(updatedAt)}`
  }
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Actif hier'
  return `Dernière activité · ${shortTime(updatedAt)}`
}

export function truncateWords(text, maxWords = 4) {
  if (!text) return ''
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return words.join(' ')
  return `${words.slice(0, maxWords).join(' ')}…`
}
