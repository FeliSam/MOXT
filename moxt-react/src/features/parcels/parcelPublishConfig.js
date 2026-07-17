import {
  FiBox,
  FiCheckCircle,
  FiFileText,
  FiGift,
  FiHeart,
  FiMapPin,
  FiMonitor,
  FiPackage,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'

export const PARCEL_PUBLISH_STEPS = [
  { key: 'route', labelKey: 'publish.parcel.steps.route', icon: FiMapPin },
  { key: 'cargo', labelKey: 'publish.parcel.steps.cargo', icon: FiPackage },
  { key: 'terms', labelKey: 'publish.parcel.steps.terms', icon: FiBox },
  { key: 'review', labelKey: 'publish.parcel.steps.review', icon: FiCheckCircle },
]

export const PARCEL_ACCEPTED_TYPES = [
  {
    value: 'clothes',
    labelKey: 'publish.parcel.types.clothes.label',
    subKey: 'publish.parcel.types.clothes.sub',
    icon: FiShoppingBag,
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'food',
    labelKey: 'publish.parcel.types.food.label',
    subKey: 'publish.parcel.types.food.sub',
    icon: FiBox,
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    value: 'electronics',
    labelKey: 'publish.parcel.types.electronics.label',
    subKey: 'publish.parcel.types.electronics.sub',
    icon: FiMonitor,
    color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  },
  {
    value: 'documents',
    labelKey: 'publish.parcel.types.documents.label',
    subKey: 'publish.parcel.types.documents.sub',
    icon: FiFileText,
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  {
    value: 'cosmetics',
    labelKey: 'publish.parcel.types.cosmetics.label',
    subKey: 'publish.parcel.types.cosmetics.sub',
    icon: FiHeart,
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  },
  {
    value: 'gifts',
    labelKey: 'publish.parcel.types.gifts.label',
    subKey: 'publish.parcel.types.gifts.sub',
    icon: FiGift,
    color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  },
  {
    value: 'medicine',
    labelKey: 'publish.parcel.types.medicine.label',
    subKey: 'publish.parcel.types.medicine.sub',
    icon: FiUsers,
    color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  },
]
