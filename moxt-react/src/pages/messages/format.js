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
