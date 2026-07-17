export const OWNER_ID = 'f9968533-bf1e-4c21-a665-524f2ec9e630'
export const PUBLISHER_NAME = 'Feliciano Fanou'
export const PUBLISHER_PHONE = '+79800692924'

/** Publication date in MSK with staggered hours (readable in UI). */
export function publishedAt(dayOffset, hour, minute = 0) {
  const d = new Date('2026-07-17T00:00:00+03:00')
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function futureDate(daysFromNow) {
  const d = new Date('2026-07-17T12:00:00+03:00')
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

export function eventStart(daysFromNow, hour = 18, minute = 0) {
  const d = new Date('2026-07-17T00:00:00+03:00')
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function expiresInDays(fromIso, days) {
  return new Date(new Date(fromIso).getTime() + days * 86400000).toISOString()
}
