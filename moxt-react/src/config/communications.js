import { FiBox, FiBriefcase, FiCalendar, FiRepeat, FiShoppingBag, FiUsers } from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { messagesText } from '../features/communications/messagesI18n'

export const RELATED_CONTENT_META = {
  business: {
    icon: HiOutlineBuildingOffice2,
    labelKey: 'communications.related.business',
    tone: 'bg-violet-500',
  },
  event: { icon: FiCalendar, labelKey: 'communications.related.event', tone: 'bg-amber-500' },
  job: { icon: FiBriefcase, labelKey: 'communications.related.job', tone: 'bg-blue-500' },
  listing: { icon: FiShoppingBag, labelKey: 'communications.related.listing', tone: 'bg-pink-500' },
  parcel: { icon: FiBox, labelKey: 'communications.related.parcel', tone: 'bg-orange-500' },
  p2p: { icon: FiRepeat, labelKey: 'communications.related.p2p', tone: 'bg-cyan-600' },
  transfer: { icon: FiRepeat, labelKey: 'communications.related.transfer', tone: 'bg-emerald-600' },
  general: { icon: FiUsers, labelKey: 'communications.related.general', tone: 'bg-slate-500' },
}

export const MESSAGE_SUGGESTIONS = {
  business: [
    { labelKey: 'communications.chips.business.services' },
    { labelKey: 'communications.chips.business.hours' },
    { labelKey: 'communications.chips.business.quote' },
  ],
  event: [
    { labelKey: 'communications.chips.event.seats' },
    { labelKey: 'communications.chips.event.register' },
    { labelKey: 'communications.chips.event.access' },
  ],
  job: [
    { labelKey: 'communications.chips.job.available' },
    { labelKey: 'communications.chips.job.cv' },
    { labelKey: 'communications.chips.job.process' },
  ],
  listing: [
    { labelKey: 'communications.chips.listing.available' },
    { labelKey: 'communications.chips.listing.price' },
    { labelKey: 'communications.chips.listing.details' },
  ],
  parcel: [
    { labelKey: 'communications.chips.parcel.kg' },
    { labelKey: 'communications.chips.parcel.delay' },
    { labelKey: 'communications.chips.parcel.items' },
  ],
  transfer: [
    { labelKey: 'communications.chips.transfer.status' },
    { labelKey: 'communications.chips.transfer.proof' },
    { labelKey: 'communications.chips.transfer.deadline' },
  ],
  p2p: [
    { labelKey: 'communications.chips.p2p.available' },
    { labelKey: 'communications.chips.p2p.payment' },
    { labelKey: 'communications.chips.p2p.rate' },
  ],
  general: [
    { labelKey: 'communications.chips.general.more' },
    { labelKey: 'communications.chips.general.thanks' },
    { labelKey: 'communications.chips.general.clarify' },
  ],
}

export function messageSuggestionsFor(relatedType, t) {
  const items = MESSAGE_SUGGESTIONS[relatedType] || MESSAGE_SUGGESTIONS.general
  if (typeof t !== 'function') return items.map((item) => item.labelKey)
  return items.map((item) => messagesText(t, item.labelKey))
}
