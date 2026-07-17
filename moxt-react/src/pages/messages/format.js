import { messagesText } from '../../features/communications/messagesI18n'

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

export function formatDateLabel(date, t) {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === now.toDateString()) {
    return messagesText(t, 'messages.date.today')
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return messagesText(t, 'messages.date.yesterday')
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function peerActivityLabel(updatedAt, t) {
  if (!updatedAt) return messagesText(t, 'messages.activity.new')
  const date = new Date(updatedAt)
  const diff = Date.now() - date.getTime()
  if (diff < 5 * 60 * 1000) return messagesText(t, 'messages.activity.recent')
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.max(1, Math.floor(diff / 60000))
    return messagesText(t, 'messages.activity.seenMinutes', { minutes })
  }
  if (date.toDateString() === new Date().toDateString()) {
    return messagesText(t, 'messages.activity.activeToday', { time: shortTime(updatedAt) })
  }
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return messagesText(t, 'messages.activity.activeYesterday')
  }
  return messagesText(t, 'messages.activity.last', { time: shortTime(updatedAt) })
}

export function truncateWords(text, maxWords = 4) {
  if (!text) return ''
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return words.join(' ')
  return `${words.slice(0, maxWords).join(' ')}…`
}
