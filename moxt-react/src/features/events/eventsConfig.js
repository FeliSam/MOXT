export const EVENT_CATEGORY_OPTIONS = [
  { value: 'networking', labelKey: 'events.categories.networking' },
  { value: 'training', labelKey: 'events.categories.training' },
  { value: 'culture', labelKey: 'events.categories.culture' },
  { value: 'business', labelKey: 'events.categories.business' },
  { value: 'community', labelKey: 'events.categories.community' },
]

export const EVENT_PRICE_FILTER_OPTIONS = [
  { value: '', labelKey: 'events.browse.allAccess' },
  { value: 'free', labelKey: 'events.browse.free' },
  { value: 'paid', labelKey: 'events.browse.paid' },
]

export const registrationNextStepKeys = {
  registered: {
    titleKey: 'events.registration.registered.title',
    descriptionKey: 'events.registration.registered.description',
  },
  checked_in: {
    titleKey: 'events.registration.checkedIn.title',
    descriptionKey: 'events.registration.checkedIn.description',
  },
  cancelled: {
    titleKey: 'events.registration.cancelled.title',
    descriptionKey: 'events.registration.cancelled.description',
  },
}

export const eventTrustItemKeys = [
  'events.detail.trust.venue',
  'events.detail.trust.confirmation',
  'events.detail.trust.contact',
]

export const eventPublisherTypeKeys = {
  business: 'events.publisher.business',
  individual: 'events.publisher.individual',
}

export const eventStatusLabelKeys = {
  published: 'events.status.published',
  draft: 'events.status.draft',
  registered: 'events.status.registered',
  cancelled: 'events.status.cancelled',
  full: 'events.status.full',
}

export function eventCategoryLabelKey(value) {
  return EVENT_CATEGORY_OPTIONS.find((option) => option.value === value)?.labelKey
}

export function eventPublisherTypeKey(businessId) {
  return businessId ? eventPublisherTypeKeys.business : eventPublisherTypeKeys.individual
}

export function eventStatusLabelKey(status) {
  return eventStatusLabelKeys[status]
}
