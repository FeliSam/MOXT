import {
  FiBox,
  FiGlobe,
  FiMessageSquare,
  FiRepeat,
  FiShield,
  FiShoppingBag,
  FiSmartphone,
  FiUsers,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'

export const PUBLIC_SERVICES = [
  { id: 'transfers', icon: FiRepeat },
  { id: 'parcels', icon: FiBox },
  { id: 'marketplace', icon: FiShoppingBag },
  { id: 'businesses', icon: HiOutlineBuildingOffice2 },
  { id: 'community', icon: FiUsers },
  { id: 'messages', icon: FiMessageSquare },
]

export const TRUST_PRINCIPLES = [
  { id: 'phone', icon: FiSmartphone },
  { id: 'identity', icon: FiShield },
  { id: 'messaging', icon: FiMessageSquare },
  { id: 'validation', icon: FiRepeat },
]

export const PRESENTATION_PILLARS = [
  { id: 'transfers', icon: FiRepeat },
  { id: 'community', icon: FiUsers },
  { id: 'trust', icon: FiShield },
  { id: 'i18n', icon: FiGlobe },
]

export const FAQ_ITEMS = [
  { id: 'phone' },
  { id: 'levels' },
  { id: 'profile' },
  { id: 'email' },
  { id: 'contact' },
  { id: 'pending' },
  { id: 'report' },
]

export const DISCOVERY_TYPES = [
  { value: 'all', label: 'Tout' },
  { value: 'business', label: 'Entreprises' },
  { value: 'listing', label: 'Marketplace' },
  { value: 'parcel', label: 'Colis' },
  { value: 'job', label: 'Jobs' },
  { value: 'event', label: 'Événements' },
]

export const PUBLIC_RECENT_LIMIT = 6
