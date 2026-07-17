import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiGlobe,
  FiHeart,
  FiMapPin,
  FiMic,
  FiUsers,
  FiWifi,
  FiBookOpen,
} from 'react-icons/fi'

export const EVENT_PUBLISH_STEPS = [
  { key: 'basics', labelKey: 'publish.event.steps.basics', icon: FiCalendar },
  { key: 'details', labelKey: 'publish.event.steps.program', icon: FiMic },
  { key: 'location', labelKey: 'publish.event.steps.location', icon: FiMapPin },
  { key: 'review', labelKey: 'publish.event.steps.review', icon: FiCheckCircle },
]

export const EVENT_FORMAT_OPTIONS = [
  {
    value: 'in_person',
    labelKey: 'publish.event.formats.inPerson.label',
    subKey: 'publish.event.formats.inPerson.sub',
    icon: FiMapPin,
    color:
      'bg-emerald-50 text-emerald-700 ring-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    value: 'online',
    labelKey: 'publish.event.formats.online.label',
    subKey: 'publish.event.formats.online.sub',
    icon: FiWifi,
    color: 'bg-blue-50 text-blue-700 ring-blue-500 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'hybrid',
    labelKey: 'publish.event.formats.hybrid.label',
    subKey: 'publish.event.formats.hybrid.sub',
    icon: FiGlobe,
    color:
      'bg-violet-50 text-violet-700 ring-violet-500 dark:bg-violet-950/40 dark:text-violet-300',
  },
]

export const EVENT_PUBLISH_CATEGORIES = [
  { value: 'networking', labelKey: 'publish.event.categories.networking' },
  { value: 'training', labelKey: 'publish.event.categories.training' },
  { value: 'culture', labelKey: 'publish.event.categories.culture' },
  { value: 'business', labelKey: 'publish.event.categories.business' },
  { value: 'community', labelKey: 'publish.event.categories.community' },
]

export const EVENT_CAT_ICONS = {
  networking: FiUsers,
  training: FiBookOpen,
  culture: FiMic,
  business: FiBriefcase,
  community: FiHeart,
}

export const EVENT_CAT_COLORS = {
  networking: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  training: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  culture: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  business: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  community: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
}
